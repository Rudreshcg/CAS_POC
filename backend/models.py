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
            'cluster': self.cluster,
            'enriched_description': self.enriched_description,
            'final_search_term': self.final_search_term,
            'cas_number': self.cas_number,
            'inci_name': self.inci_name,
            'synonyms': self.synonyms,
            'created_at': self.created_at.isoformat(),
            'confidence_score': self.confidence_score,
            'validation_status': self.validation_status,
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

    def to_dict(self):
        return {
            'id': self.id,
            'sub_category': self.sub_category,
            'identifier_name': self.identifier_name,
            'parameters': json.loads(self.parameters) if self.parameters else [],
            'purity_rules': json.loads(self.purity_rules) if self.purity_rules else []
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
