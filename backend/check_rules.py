from app import app, db, EnrichmentRule, CasLookupResult

app.app_context().push()

print("=== ENRICHMENT RULES ===")
rules = EnrichmentRule.query.all()
for r in rules:
    print(f"Rule ID={r.id}: sub_category='{r.sub_category}' identifier='{r.identifier_name}' params={r.parameters}")

print("\n=== DATABASE ROWS (first 3) ===")
rows = CasLookupResult.query.limit(3).all()
for r in rows:
    print(f"Row {r.row_number}: sub_category='{r.sub_category}' enriched='{r.enriched_description}'")

print("\n=== CHECKING MATCH ===")
if rules and rows:
    rule_sub = rules[0].sub_category
    row_sub = rows[0].sub_category
    print(f"Rule sub_category: '{rule_sub}' (bytes: {rule_sub.encode()})")
    print(f"Row sub_category: '{row_sub}' (bytes: {row_sub.encode()})")
    print(f"Match: {rule_sub == row_sub}")
    print(f"Case-insensitive match: {rule_sub.lower() == row_sub.lower()}")
