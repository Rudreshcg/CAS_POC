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
            
        # Overall Stats for KPIs
        total_spend = db.session.query(func.sum(SpendRecord.amount)).filter(
            SpendRecord.id.in_(query.with_entities(SpendRecord.id))
        ).scalar() or 0
        total_suppliers = db.session.query(func.count(func.distinct(SpendRecord.vendor_name))).filter(
            SpendRecord.id.in_(query.with_entities(SpendRecord.id))
        ).scalar() or 0
        total_transactions = query.count()
        po_count = db.session.query(func.count(func.distinct(SpendRecord.po_number))).filter(
            SpendRecord.id.in_(query.with_entities(SpendRecord.id))
        ).scalar() or 0
        
        # Mocks for PR and Invoice counts (based on original logic)
        pr_count = int(po_count * 1.1)
        invoice_count = int(total_transactions * 0.8)

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

        # 6. Contract vs Non-Contract Spend
        contract_spend = db.session.query(func.sum(SpendRecord.amount)).filter(
            SpendRecord.id.in_(query.with_entities(SpendRecord.id)),
            SpendRecord.is_contract == True
        ).scalar() or 0
        non_contract_spend = total_spend - contract_spend
        contract_data = [
            {"name": "Contracted", "value": float(contract_spend)},
            {"name": "Non-contract", "value": float(non_contract_spend)}
        ]

        return jsonify({
            "kpis": {
                "spend": float(total_spend),
                "suppliers": total_suppliers,
                "transactions": total_transactions,
                "po_count": po_count,
                "pr_count": pr_count,
                "invoice_count": invoice_count
            },
            "category_data": category_data,
            "trend_data": trend_data,
            "region_data": region_data,
            "supplier_data": supplier_data,
            "pareto_data": pareto_data,
            "contract_data": contract_data
        })
    except Exception as e:
        print(f"Dashboard Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@spend_bp.route('/api/spend-analysis/enriched-insights')
def enriched_spend_insights():
    try:
        results = db.session.query(
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
        ).group_by(
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
