from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class MaterialData(db.Model):
    __tablename__ = 'material_data'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    row_number = db.Column(db.Integer, nullable=False)
    
    # Original CSV Columns Mapped
    commodity = db.Column(db.String(255))
    sub_category = db.Column(db.String(255))
    item_description = db.Column(db.Text)
    brand = db.Column(db.String(255))  # Item used for Brand(s)
    item_code = db.Column(db.String(100))
    plant = db.Column(db.String(255))  # Factory/Country
    region = db.Column(db.String(255)) # Region (NAC, ASEAN, etc.)
    cluster = db.Column(db.String(255))
    
    # Enriched Data
    enriched_description = db.Column(db.Text)
    final_search_term = db.Column(db.String(255))
    cas_number = db.Column(db.String(50))
    inci_name = db.Column(db.String(255))
    synonyms = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Validation Fields
    confidence_score = db.Column(db.Integer, default=70)
    validation_status = db.Column(db.String(50), default='Pending')
    validation_documents = db.Column(db.Text, default='[]')
    
    # Spend Analysis Fields
    quantity = db.Column(db.Float, default=0.0)
    spend_value = db.Column(db.Float, default=0.0)

    # Relationship to Dynamic Parameters
    parameters = db.relationship('MaterialParameter', backref='material', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'row_number': self.row_number,
            'commodity': self.commodity,
            'sub_category': self.sub_category,
            'item_description': self.item_description,
            'brand': self.brand,
            'item_code': self.item_code,
            'plant': self.plant,
            'region': self.region,
            'cluster': self.cluster,
            'enriched_description': self.enriched_description,
            'final_search_term': self.final_search_term,
            'cas_number': self.cas_number,
            'inci_name': self.inci_name,
            'synonyms': self.synonyms,
            'created_at': self.created_at.isoformat(),
            'confidence_score': self.confidence_score,
            'validation_status': self.validation_status,
            'quantity': self.quantity,
            'spend_value': self.spend_value,
            'parameters': {p.name: p.value for p in self.parameters},
            'validation_documents': json.loads(self.validation_documents) if self.validation_documents else []
        }

class MaterialParameter(db.Model):
    __tablename__ = 'material_parameter'
    
    id = db.Column(db.Integer, primary_key=True)
    material_id = db.Column(db.Integer, db.ForeignKey('material_data.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'name': self.name,
            'value': self.value
        }

class EnrichmentRule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sub_category = db.Column(db.String(255), unique=True, nullable=False)
    identifier_name = db.Column(db.String(255), default="CAS")
    parameters = db.Column(db.Text, default="[]") # JSON string of parameter names
    purity_rules = db.Column(db.Text, default="[]") # JSON string for purity ranges
    hierarchy = db.Column(db.Text, default='["Region", "Identifier", "Factory"]') # JSON string for hierarchy order

    def to_dict(self):
        return {
            'id': self.id,
            'sub_category': self.sub_category,
            'identifier_name': self.identifier_name,
            'parameters': json.loads(self.parameters) if self.parameters else [],
            'purity_rules': json.loads(self.purity_rules) if self.purity_rules else [],
            'hierarchy': json.loads(self.hierarchy) if self.hierarchy else ["Region", "Identifier", "Factory"]
        }

class NodeAnnotation(db.Model):
    __tablename__ = 'node_annotation'
    
    id = db.Column(db.Integer, primary_key=True)
    node_type = db.Column(db.String(50), nullable=False)   # 'brand' or 'material'
    node_identifier = db.Column(db.String(255), nullable=False) # Brand Name or Material ID (as string)
    annotation_type = db.Column(db.String(50), default='info') # 'info' or 'qa'
    
    content = db.Column(db.Text)          # For 'info'
    question = db.Column(db.Text)         # For 'qa'
    answer = db.Column(db.Text)           # For 'qa'
    
    is_open = db.Column(db.Boolean, default=True) # Logic: True if QA and no answer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'node_type': self.node_type,
            'node_identifier': self.node_identifier,
            'annotation_type': self.annotation_type,
            'content': self.content,
            'question': self.question,
            'answer': self.answer,
            'is_open': self.is_open,
            'created_at': self.created_at.isoformat()
        }

class ClusterOverride(db.Model):
    __tablename__ = 'cluster_override'
    
    id = db.Column(db.Integer, primary_key=True)
    node_id = db.Column(db.String(255), nullable=False, unique=True) # The ID of the node being moved
    target_parent_id = db.Column(db.String(255), nullable=False) # The ID of the new parent
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'node_id': self.node_id,
            'target_parent_id': self.target_parent_id,
            'created_at': self.created_at.isoformat()
        }

class SpendRecord(db.Model):
    __tablename__ = 'spend_record'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Excel Column Mappings (24 columns found in header)
    operating_unit = db.Column(db.String(100))           # Col 0: OPERATING_UNIT
    po_number = db.Column(db.String(100))                # Col 1: PO_NUMBER
    po_date = db.Column(db.String(50))                   # Col 2: PO_DATE
    month = db.Column(db.String(20))                     # Col 3: Month
    year = db.Column(db.String(10))                      # Col 4: year
    po_type = db.Column(db.String(50))                   # Col 5: PO_TYPE
    po_status = db.Column(db.String(50))                 # Col 6: PO_STATUS
    buyer_name = db.Column(db.String(100))               # Col 7: BUYER_NAME
    supplier_number = db.Column(db.String(50))           # Col 8: SUPPLIER_NUMBER
    vendor_name = db.Column(db.String(255))              # Col 9: SUPPLIER_NAME
    supplier_site = db.Column(db.String(255))            # Col 10: SUPPLIER_SITE
    item_category = db.Column(db.String(100))            # Col 11: ITEM_CATEGORY
    item_code = db.Column(db.String(100))                # Col 11: ITEM_CODE (Shared mapping for now or next col)
    item_description = db.Column(db.String(500))         # Col 12: ITEM_DESCRIPTION
    quantity = db.Column(db.Float)                       # Col 13: QUANTITY
    uom = db.Column(db.String(20))                       # Col 14: UOM
    currency = db.Column(db.String(10))                  # Col 15: CURRENCY
    exchange_rate = db.Column(db.Float)                  # Col 16: EXCHANGE_RATE
    price = db.Column(db.Float)                          # Col 17: PRICE
    payment_term = db.Column(db.String(100))             # Col 18: PAYMENT_TERM
    base_price_fc = db.Column(db.Float)                  # Col 19: BASE_PRICE_FC
    base_price_inr = db.Column(db.Float)                 # Col 20: BASE_PRICE_INR
    freight_terms = db.Column(db.String(100))            # Col 21: FREIGHT_TERMS_DSP
    ship_via = db.Column(db.String(100))                 # Col 22: SHIP_VIA_LOOKUP_CODE
    fob_dsp = db.Column(db.String(100))                  # Col 23: FOB_DSP
    
    # Metadata
    enriched_description = db.Column(db.String(500))     # NEW: LLM standardized name
    cas_number = db.Column(db.String(100))               # NEW: LLM found CAS
    amount = db.Column(db.Float)                         # Duplicate of base_price_inr for compatibility
    is_contract = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'operating_unit': self.operating_unit,
            'po_number': self.po_number,
            'po_date': self.po_date,
            'month': self.month,
            'year': self.year,
            'po_type': self.po_type,
            'po_status': self.po_status,
            'buyer_name': self.buyer_name,
            'supplier_number': self.supplier_number,
            'vendor_name': self.vendor_name,
            'supplier_site': self.supplier_site,
            'item_category': self.item_category,
            'item_code': self.item_code,
            'item_description': self.item_description,
            'quantity': self.quantity,
            'uom': self.uom,
            'currency': self.currency,
            'exchange_rate': self.exchange_rate,
            'price': self.price,
            'payment_term': self.payment_term,
            'base_price_fc': self.base_price_fc,
            'base_price_inr': self.base_price_inr,
            'amount': self.amount,
            'enriched_description': self.enriched_description,
            'cas_number': self.cas_number,
            'freight_terms': self.freight_terms,
            'ship_via': self.ship_via,
            'fob_dsp': self.fob_dsp,
            'is_contract': self.is_contract,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserPreference(db.Model):
    __tablename__ = 'user_preference'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'key': self.key,
            'value': self.value,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
