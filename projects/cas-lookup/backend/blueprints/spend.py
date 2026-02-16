from flask import Blueprint, jsonify, request, current_app, send_file
import os
import pandas as pd
from sqlalchemy import func
from models import db, SpendRecord, MaterialData, UserPreference
from geocoding_data import CITY_COORDS
import json

spend_bp = Blueprint('spend', __name__)

def parse_float(val):
    try:
        if pd.isna(val):
            return 0.0
        return float(str(val).replace(',', '').strip())
    except:
        return 0.0

def parse_str(val):
    if pd.isna(val):
        return None
    return str(val).strip()

def init_spend_data():
    """Initialize spend data from Excel file into database"""
    try:
        # Check if data already exists
        if SpendRecord.query.first():
            print("✅ Spend Database already populated. Skipping ingestion.")
            return
        
        print("🚀 Starting Spend Data Ingestion from Excel...")
        
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        xlsx_path = os.path.join(current_dir, 'Purchase History.xlsx')
        if not os.path.exists(xlsx_path):
            print(f"❌ Purchase History.xlsx not found at {xlsx_path}")
            return
        
        df = pd.read_excel(xlsx_path, sheet_name='Sheet1', header=None, engine='openpyxl')
        
        records = []
        for idx, row in df.iterrows():
            if idx == 0 or (pd.isna(row[9]) and pd.isna(row[12])):
                continue
            
            try:
                record = SpendRecord(
                    operating_unit=parse_str(row[0]),
                    po_number=parse_str(row[1]),
                    po_date=parse_str(row[2]),
                    line_number=parse_str(row[3]),
                    shipment_number=parse_str(row[4]),
                    distribution_number=parse_str(row[5]),
                    release_number=parse_str(row[6]),
                    po_version=parse_str(row[7]),
                    supplier_number=parse_str(row[8]),
                    vendor_name=parse_str(row[9]) or "Unknown",
                    buyer_name=parse_str(row[10]),
                    item_category=parse_str(row[11]),
                    item_description=parse_str(row[12]) or "Unknown",
                    quantity=parse_float(row[13]),
                    uom=parse_str(row[14]),
                    unit_price_fc=parse_float(row[15]),
                    unit_price_inr=parse_float(row[16]),
                    currency_code=parse_str(row[17]),
                    base_price_fc=parse_float(row[18]),
                    base_price_inr=parse_float(row[19]),
                    amount=parse_float(row[20]),
                    tax_amount=parse_float(row[21]) if len(row) > 21 else 0.0,
                    total_amount=parse_float(row[22]) if len(row) > 22 else 0.0,
                    fob_dsp=parse_str(row[23]) if len(row) > 23 else None,
                    is_contract=False
                )
                records.append(record)
            except Exception as e:
                print(f"⚠️ Error processing row {idx}: {e}")
                continue
        
        if records:
            db.session.bulk_save_objects(records)
            db.session.commit()
            print(f"✅ Successfully ingested {len(records)} spend records.")
    except Exception as e:
        print(f"❌ Spend Data Ingestion Failed: {e}")
        db.session.rollback()

@spend_bp.route('/api/spend-analysis/dashboard')
def solve_spend_dashboard():
    try:
        # Get query parameters
        category = request.args.get('category')
        supplier = request.args.get('supplier')
        region = request.args.get('region')
        enriched_desc = request.args.get('enriched_description')
        operating_unit = request.args.get('operating_unit')
        year = request.args.get('year')
        
        # Build query with join to potentially get enriched description from MaterialData
        query = db.session.query(SpendRecord).outerjoin(
            MaterialData,
            db.or_(
                db.and_(MaterialData.cas_number == SpendRecord.cas_number, MaterialData.cas_number != None, SpendRecord.cas_number != "NOT FOUND"),
                MaterialData.enriched_description == SpendRecord.enriched_description,
                db.and_(MaterialData.enriched_description.like(SpendRecord.enriched_description + '%'), SpendRecord.enriched_description != None)
            )
        )

        if category and category != 'All':
            query = query.filter(SpendRecord.item_category == category)
        if supplier and supplier != 'All':
            query = query.filter(SpendRecord.vendor_name == supplier)
        if operating_unit and operating_unit != 'All':
            query = query.filter(SpendRecord.operating_unit == operating_unit)
        if region and region != 'All':
            # Note: region exists in MaterialData or is mapped from Operating Unit
            # If region is not explicitly in SpendRecord, we might skip it or map it.
            # For now, let's stick to operating_unit as the primary filter requested.
            pass
        if enriched_desc and enriched_desc != 'All':
             query = query.filter(SpendRecord.enriched_description == enriched_desc)
        if year and year != 'All':
             query = query.filter(SpendRecord.year == year)
            
        # Overall Stats for KPIs
        total_spend = db.session.query(func.sum(SpendRecord.amount)).filter(
            SpendRecord.id.in_(query.with_entities(SpendRecord.id))
        ).scalar() or 0
        total_suppliers = db.session.query(func.count(func.distinct(SpendRecord.vendor_name))).filter(
            SpendRecord.id.in_(query.with_entities(SpendRecord.id))
        ).scalar() or 0
        po_count = db.session.query(func.count(func.distinct(SpendRecord.po_number))).filter(
            SpendRecord.id.in_(query.with_entities(SpendRecord.id))
        ).scalar() or 0
        total_buyers = db.session.query(func.count(func.distinct(SpendRecord.buyer_name))).filter(
            SpendRecord.id.in_(query.with_entities(SpendRecord.id))
        ).scalar() or 0
        
        # Mocks for PR counts (based on original logic)
        pr_count = int(po_count * 1.1)

        # 1. Spend by Material/Item Description (Top 8)
        cat_result = db.session.query(
            SpendRecord.item_description, 
            func.sum(SpendRecord.amount)
        ).filter(SpendRecord.id.in_(query.with_entities(SpendRecord.id))).group_by(
            SpendRecord.item_description
        ).order_by(func.sum(SpendRecord.amount).desc()).limit(8).all()
        category_data = [{"name": str(r[0]), "value": float(r[1])} for r in cat_result]

        # 2. Market Trend (Aggregated by Month)
        trend_query = db.session.query(
            SpendRecord.po_date, 
            SpendRecord.amount
        ).filter(SpendRecord.id.in_(query.with_entities(SpendRecord.id))).all()

        trend_map = {}
        for date_str, amt in trend_query:
            try:
                # Expected format: 2023-01-02 or similar
                if date_str and len(str(date_str)) >= 7:
                    month_key = str(date_str)[:7]  # '2023-01'
                    trend_map[month_key] = trend_map.get(month_key, 0) + (amt or 0)
            except:
                continue
        
        trend_sorted = sorted(trend_map.items())
        trend_data = [{"name": k, "value": float(v)} for k, v in trend_sorted]

        # 3. Spend by Region (Operating Unit)
        reg_result = db.session.query(
            SpendRecord.operating_unit, 
            func.sum(SpendRecord.amount)
        ).filter(SpendRecord.id.in_(query.with_entities(SpendRecord.id))).group_by(
            SpendRecord.operating_unit
        ).order_by(func.sum(SpendRecord.amount).desc()).all()
        region_data = [{"name": str(r[0]), "value": float(r[1])} for r in reg_result]

        # 4. Spend by Supplier (Top 10)
        sup_result = db.session.query(
            SpendRecord.vendor_name, 
            func.sum(SpendRecord.amount)
        ).filter(SpendRecord.id.in_(query.with_entities(SpendRecord.id))).group_by(
            SpendRecord.vendor_name
        ).order_by(func.sum(SpendRecord.amount).desc()).limit(10).all()
        supplier_data = [{"name": str(r[0]), "value": float(r[1])} for r in sup_result]

        # 5. Pareto Analysis (Suppliers)
        pareto_raw = db.session.query(
            SpendRecord.vendor_name, 
            func.sum(SpendRecord.amount)
        ).filter(SpendRecord.id.in_(query.with_entities(SpendRecord.id))).group_by(
            SpendRecord.vendor_name
        ).order_by(func.sum(SpendRecord.amount).desc()).limit(20).all()
        
        pareto_data = []
        cum_spend_val = 0
        for name, val in pareto_raw:
            cum_spend_val += (val or 0)
            cum_pct = (cum_spend_val / total_spend) * 100 if total_spend > 0 else 0
            pareto_data.append({
                "name": str(name),
                "spend": float(val or 0),
                "cumulativePercentage": round(float(cum_pct), 1)
            })

        # 6. Payment Term Distribution
        pt_result = db.session.query(
            SpendRecord.payment_term,
            func.sum(SpendRecord.amount)
        ).filter(SpendRecord.id.in_(query.with_entities(SpendRecord.id))).group_by(
            SpendRecord.payment_term
        ).order_by(func.sum(SpendRecord.amount).desc()).limit(10).all()
        payment_term_data = [{"name": str(r[0]) if r[0] else "Other", "value": float(r[1] or 0)} for r in pt_result]

        # 7. PO Status Distribution
        ps_result = db.session.query(
            SpendRecord.po_status,
            func.sum(SpendRecord.amount)
        ).filter(SpendRecord.id.in_(query.with_entities(SpendRecord.id))).group_by(
            SpendRecord.po_status
        ).order_by(func.sum(SpendRecord.amount).desc()).all()
        po_status_data = [{"name": str(r[0]) if r[0] else "Unknown", "value": float(r[1] or 0)} for r in ps_result]

        return jsonify({
            "kpis": {
                "spend": float(total_spend),
                "suppliers": total_suppliers,
                "buyers": total_buyers,
                "po_count": po_count,
                "pr_count": pr_count
            },
            "category_data": category_data,
            "trend_data": trend_data,
            "region_data": region_data,
            "supplier_data": supplier_data,
            "pareto_data": pareto_data,
            "payment_term_data": payment_term_data,
            "po_status_data": po_status_data
        })
    except Exception as e:
        print(f"Dashboard Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/enriched-insights')
def enriched_spend_insights():
    try:
        enriched_desc = request.args.get('enriched_description')
        operating_unit = request.args.get('operating_unit')
        year = request.args.get('year')
        
        query = db.session.query(
            MaterialData.enriched_description,
            func.sum(SpendRecord.amount).label('total_spend'),
            func.count(SpendRecord.id).label('transaction_count')
        ).join(
            SpendRecord, 
            db.or_(
                db.and_(MaterialData.cas_number == SpendRecord.cas_number, MaterialData.cas_number != None, SpendRecord.cas_number != "NOT FOUND"),
                MaterialData.enriched_description == SpendRecord.enriched_description,
                db.and_(MaterialData.enriched_description.like(SpendRecord.enriched_description + '%'), SpendRecord.enriched_description != None)
            )
        )

        if enriched_desc and enriched_desc != 'All':
            query = query.filter(SpendRecord.enriched_description == enriched_desc)
        if operating_unit and operating_unit != 'All':
            query = query.filter(SpendRecord.operating_unit == operating_unit)
        if year and year != 'All':
            query = query.filter(SpendRecord.year == year)

        results = query.group_by(
            MaterialData.enriched_description
        ).order_by(
            func.sum(SpendRecord.amount).desc()
        ).limit(20).all()
        
        data = [
            {
                "name": str(r[0] or "Unmapped/Unknown"),
                "value": float(r[1] or 0),
                "count": r[2]
            } for r in results
        ]
        
        return jsonify(data)
    except Exception as e:
        print(f"Enriched Insights Error: {e}")
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/table')
def spend_table_view():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        sort_by = request.args.get('sort_by', 'amount')
        sort_order = request.args.get('sort_order', 'desc')
        search = request.args.get('search', '')
        enriched_desc = request.args.get('enriched_description')
        operating_unit = request.args.get('operating_unit')
        year = request.args.get('year')

        # Build query with join to potentially get enriched description
        query = db.session.query(
            SpendRecord,
            MaterialData.enriched_description
        ).outerjoin(
            MaterialData, 
            db.or_(
                db.and_(MaterialData.cas_number == SpendRecord.cas_number, MaterialData.cas_number != None, SpendRecord.cas_number != "NOT FOUND"),
                MaterialData.enriched_description == SpendRecord.enriched_description,
                db.and_(MaterialData.enriched_description.like(SpendRecord.enriched_description + '%'), SpendRecord.enriched_description != None)
            )
        )
        
        if search:
            query = query.filter(db.or_(
                SpendRecord.vendor_name.ilike(f'%{search}%'),
                SpendRecord.item_description.ilike(f'%{search}%'),
                SpendRecord.po_number.ilike(f'%{search}%'),
                MaterialData.enriched_description.ilike(f'%{search}%')
            ))

        if enriched_desc and enriched_desc != 'All':
            query = query.filter(SpendRecord.enriched_description == enriched_desc)
        if operating_unit and operating_unit != 'All':
            query = query.filter(SpendRecord.operating_unit == operating_unit)
        if year and year != 'All':
            query = query.filter(SpendRecord.year == year)

        if sort_by == 'enriched_description':
            sort_col = MaterialData.enriched_description
        else:
            sort_col = getattr(SpendRecord, sort_by)

        if sort_order == 'desc':
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        records = []
        for row, enriched in pagination.items:
            d = row.to_dict()
            d['enriched_description'] = enriched or "Not Enriched"
            records.append(d)

        return jsonify({
            "records": records,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page
        })
    except Exception as e:
        print(f"Table View Error: {e}")
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/suppliers-map')
def spend_map_view():
    try:
        enriched_desc = request.args.get('enriched_description')
        operating_unit = request.args.get('operating_unit')
        year = request.args.get('year')
        
        query = db.session.query(
            SpendRecord.vendor_name,
            SpendRecord.operating_unit,
            SpendRecord.supplier_site,
            func.sum(SpendRecord.amount),
            func.count(SpendRecord.id)
        )
        
        if enriched_desc and enriched_desc != 'All':
            query = query.filter(SpendRecord.enriched_description == enriched_desc)
        if operating_unit and operating_unit != 'All':
            query = query.filter(SpendRecord.operating_unit == operating_unit)
        if year and year != 'All':
            query = query.filter(SpendRecord.year == year)
            
        results = query.group_by(SpendRecord.vendor_name, SpendRecord.operating_unit, SpendRecord.supplier_site).order_by(func.sum(SpendRecord.amount).desc()).all()
        
        def geocode(site, unit):
            if site and site.lower() in CITY_COORDS:
                return [CITY_COORDS[site.lower()]['lat'], CITY_COORDS[site.lower()]['lng']]
            if unit and unit.lower() in CITY_COORDS:
                return [CITY_COORDS[unit.lower()]['lat'], CITY_COORDS[unit.lower()]['lng']]
            return [20.5937, 78.9629] # Default India center
            
        suppliers = []
        for r in results:
            coords = geocode(r[2], r[1])
            amt = float(r[3] or 0)
            
            # Determine spend category for marker styling
            spend_cat = 'low'
            if amt > 50000000: spend_cat = 'very_high'
            elif amt > 10000000: spend_cat = 'high'
            elif amt > 1000000: spend_cat = 'medium'

            suppliers.append({
                "vendor_name": r[0],
                "supplier_site": r[2] or "Unknown",
                "operating_unit": r[1] or "Unknown",
                "latitude": coords[0],
                "longitude": coords[1],
                "total_spend": amt,
                "transaction_count": r[4],
                "spend_category": spend_cat
            })
            
        return jsonify({
            "suppliers": suppliers,
            "summary": {
                "total_suppliers": len(set(r[0] for r in results)),
                "total_sites": len(set(r[2] for r in results)),
                "total_spend": sum(r[3] for r in results if r[3])
            }
        })
    except Exception as e:
        print(f"Map View Error: {e}")
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/enriched-descriptions')
def get_enriched_descriptions():
    try:
        # Source from SpendRecord and only show items that match our new standardized format (_cas_)
        descs = db.session.query(SpendRecord.enriched_description).filter(
            SpendRecord.enriched_description.like('%_cas_%')
        ).distinct().all()
        return jsonify(sorted([d[0] for d in descs if d[0]]))
    except Exception as e:
        print(f"Error fetching enriched descriptions: {e}")
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/operating-units')
def get_operating_units():
    try:
        units = db.session.query(SpendRecord.operating_unit).distinct().all()
        return jsonify(sorted([u[0] for u in units if u[0]]))
    except Exception as e:
        print(f"Error fetching operating units: {e}")
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/risk-analysis')
def get_risk_analysis():
    try:
        operating_unit = request.args.get('operating_unit', 'All')
        selected_year = request.args.get('year', 'All')
        
        query = SpendRecord.query
        if operating_unit != 'All':
            query = query.filter(SpendRecord.operating_unit == operating_unit)
        if selected_year != 'All':
            query = query.filter(SpendRecord.year == selected_year)
            
        records = query.all()
        
        # Group by material (enriched_description)
        material_risks = {}
        
        # Fetch configuration from database
        pref_sensitive = UserPreference.query.filter_by(key='sensitive_countries').first()
        pref_high_risk = UserPreference.query.filter_by(key='high_risk_countries').first()
        pref_concentration = UserPreference.query.filter_by(key='concentration_threshold').first()
        pref_disaster = UserPreference.query.filter_by(key='natural_disaster_countries').first()
        
        SENSITIVE_COUNTRIES = json.loads(pref_sensitive.value) if pref_sensitive else ['Russia', 'Iran', 'Ukraine', 'Israel', 'China', 'Indonesia']
        HIGH_RISK_COUNTRIES = json.loads(pref_high_risk.value) if pref_high_risk else ['Russia', 'Iran', 'Ukraine', 'Israel']
        CONCENTRATION_THRESHOLD = int(pref_concentration.value) if pref_concentration else 75
        DISASTER_COUNTRIES = json.loads(pref_disaster.value) if pref_disaster else []
        
        def get_country(site):
            if not site: return "Unknown"
            site_key = site.lower().strip()
            if site_key in CITY_COORDS:
                name = CITY_COORDS[site_key]['name']
                if ',' in name:
                    return name.split(',')[-1].strip()
                return name
            return "Unknown"

        for r in records:
            mat = r.enriched_description
            # Filter out placeholder data
            if not mat or str(mat).lower() in ['other', 'unknown', 'nan', 'none']: 
                continue
                
            mat_key = (mat, r.item_code or "N/A")
            if mat_key not in material_risks:
                material_risks[mat_key] = {
                    "material": mat,
                    "item_code": r.item_code or "N/A",
                    "suppliers": set(),
                    "countries": {},
                    "sites": {},  # Track supplier sites
                    "total_spend": 0,
                    "risks": []
                }
            
            material_risks[mat_key]["suppliers"].add(r.supplier_number)
            country = get_country(r.supplier_site)
            site = r.supplier_site or "Unknown"
            material_risks[mat_key]["countries"][country] = material_risks[mat_key]["countries"].get(country, 0) + (r.amount or 0)
            material_risks[mat_key]["sites"][site] = material_risks[mat_key]["sites"].get(site, 0) + (r.amount or 0)
            material_risks[mat_key]["total_spend"] += (r.amount or 0)
                
        results = []
        for mat_key, m_data in material_risks.items():
            risks = []
            max_severity = "Low"
            
            # 1. Single Source Risk
            if len(m_data["suppliers"]) == 1:
                risks.append({
                    "type": "Single Source",
                    "severity": "High",
                    "description": "Only one vendor globally for this material."
                })
                max_severity = "High"
                
            # 2. Geo Political Risk
            geo_risk_countries = [c for c in m_data["countries"].keys() if c != "Unknown" and any(sc in c for sc in SENSITIVE_COUNTRIES)]
            if geo_risk_countries:
                severity = "Medium"
                if any(hc in str(geo_risk_countries) for hc in HIGH_RISK_COUNTRIES):
                    severity = "High"
                risks.append({
                    "type": "Geo Political",
                    "severity": severity,
                    "description": f"Sourcing from sensitive regions: {', '.join(geo_risk_countries)}"
                })
                if severity == "High": max_severity = "High"
                elif max_severity != "High": max_severity = "Medium"
                
            # 3. Country Risk
            # Check if single source is from sensitive country
            if len(m_data["suppliers"]) == 1:
                supplier_countries = [c for c in m_data["countries"].keys() if c != "Unknown"]
                if supplier_countries and any(any(sc in country for sc in SENSITIVE_COUNTRIES) for country in supplier_countries):
                    risks.append({
                        "type": "Country Risk",
                        "severity": "Medium",
                        "description": f"Single source from sensitive country: {', '.join(supplier_countries)}"
                    })
                    if max_severity != "High": max_severity = "Medium"
            
            # Check if >X% of vendors are from sensitive countries
            total_suppliers = len(m_data["suppliers"])
            if total_suppliers > 1:
                for country, spend in m_data["countries"].items():
                    if country != "Unknown" and m_data["total_spend"] > 0:
                        concentration = (spend / m_data["total_spend"]) * 100
                        if concentration > CONCENTRATION_THRESHOLD and any(sc in country for sc in SENSITIVE_COUNTRIES):
                            risks.append({
                                "type": "Country Risk",
                                "severity": "Medium",
                                "description": f"Over {CONCENTRATION_THRESHOLD}% of spend from sensitive country: {country}"
                            })
                            if max_severity != "High": max_severity = "Medium"
                            break
            
            # 4. Natural Disaster Risk (case-insensitive matching)
            disaster_countries = [c for c in m_data["countries"].keys() if c != "Unknown" and any(dc.lower() in c.lower() for dc in DISASTER_COUNTRIES)]
            if disaster_countries:
                risks.append({
                    "type": "Natural Disaster",
                    "severity": "High",
                    "description": f"Sourcing from disaster-affected regions: {', '.join(disaster_countries)}"
                })
                max_severity = "High"

            if risks:
                # Find dominant site (highest spend) excluding "Unknown" if possible
                valid_sites = {s: spend for s, spend in m_data["sites"].items() if s and s != "Unknown"}
                dominant_site = max(valid_sites, key=valid_sites.get) if valid_sites else "Unknown"

                results.append({
                    "material": m_data["material"],
                    "item_code": m_data["item_code"],
                    "total_spend": m_data["total_spend"],
                    "supplier_count": len(m_data["suppliers"]),
                    "risks": risks,
                    "max_severity": max_severity,
                    "dominant_site": dominant_site
                })
                
        # Sort by spend and severity
        results.sort(key=lambda x: (x["max_severity"] == "High", x["max_severity"] == "Medium", x["total_spend"]), reverse=True)
        
        return jsonify({
            "material_risks": results[:100], # Limit to top 100 risky materials
            "summary": {
                "high_risk_count": len([r for r in results if r["max_severity"] == "High"]),
                "medium_risk_count": len([r for r in results if r["max_severity"] == "Medium"]),
                "low_risk_count": len([r for r in results if r["max_severity"] == "Low"]),
                "total_risky_materials": len(results)
            }
        })
    except Exception as e:
        print(f"Risk Analysis Error: {e}")
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/risk-config', methods=['GET', 'POST'])
def manage_risk_config():
    try:
        if request.method == 'POST':
            data = request.json
            sensitive = data.get('sensitive_countries', [])
            high_risk = data.get('high_risk_countries', [])
            concentration = data.get('concentration_threshold', 75)
            disaster = data.get('natural_disaster_countries', [])
            
            # Save or Update
            config_map = [
                ('sensitive_countries', sensitive),
                ('high_risk_countries', high_risk),
                ('concentration_threshold', concentration),
                ('natural_disaster_countries', disaster)
            ]
            
            for key, val in config_map:
                pref = UserPreference.query.filter_by(key=key).first()
                if not pref:
                    pref = UserPreference(key=key)
                    db.session.add(pref)
                pref.value = json.dumps(val) if isinstance(val, list) else str(val)
            
            db.session.commit()
            return jsonify({"status": "success"})
            
        # GET default logic
        pref_sensitive = UserPreference.query.filter_by(key='sensitive_countries').first()
        pref_high_risk = UserPreference.query.filter_by(key='high_risk_countries').first()
        pref_concentration = UserPreference.query.filter_by(key='concentration_threshold').first()
        pref_disaster = UserPreference.query.filter_by(key='natural_disaster_countries').first()
        
        return jsonify({
            "sensitive_countries": json.loads(pref_sensitive.value) if pref_sensitive else ['Russia', 'Iran', 'Ukraine', 'Israel', 'China', 'Indonesia'],
            "high_risk_countries": json.loads(pref_high_risk.value) if pref_high_risk else ['Russia', 'Iran', 'Ukraine', 'Israel'],
            "concentration_threshold": int(pref_concentration.value) if pref_concentration else 75,
            "natural_disaster_countries": json.loads(pref_disaster.value) if pref_disaster else []
        })
    except Exception as e:
        print(f"Error managing risk config: {e}")
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/years')
def get_years():
    try:
        years = db.session.query(SpendRecord.year).distinct().all()
        return jsonify(sorted([str(y[0]) for y in years if y[0]], reverse=True))
    except Exception as e:
        print(f"Error fetching years: {e}")
        return jsonify({"error": str(e)}), 500
