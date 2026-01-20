from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class CasLookupResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    row_number = db.Column(db.Integer, nullable=False)
    commodity = db.Column(db.String(255))
    sub_category = db.Column(db.String(255))
    item_description = db.Column(db.Text)
    enriched_description = db.Column(db.Text)
    final_search_term = db.Column(db.String(255))
    cas_number = db.Column(db.String(50))
    inci_name = db.Column(db.String(255))
    synonyms = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Validation Fields
    confidence_score = db.Column(db.Integer, default=70) # 70% default for AI/Search
    validation_status = db.Column(db.String(50), default='Pending') # Pending, Validated
    validation_documents = db.Column(db.Text, default='[]') # JSON array: [{"type": "MSDS", "path": "..."}]

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'row_number': self.row_number,
            'commodity': self.commodity,
            'sub_category': self.sub_category,
            'item_description': self.item_description,
            'enriched_description': self.enriched_description,
            'final_search_term': self.final_search_term,
            'cas_number': self.cas_number,
            'inci_name': self.inci_name,
            'synonyms': self.synonyms,
            'created_at': self.created_at.isoformat(),
            'confidence_score': self.confidence_score,
            'validation_status': self.validation_status,
            'validation_documents': json.loads(self.validation_documents) if self.validation_documents else []
        }

class EnrichmentRule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sub_category = db.Column(db.String(255), unique=True, nullable=False)
    identifier_name = db.Column(db.String(255), default="CAS")
    parameters = db.Column(db.Text, default="[]") # JSON string of parameter names

    def to_dict(self):
        return {
            'id': self.id,
            'sub_category': self.sub_category,
            'identifier_name': self.identifier_name,
            'parameters': json.loads(self.parameters) if self.parameters else []
        }
