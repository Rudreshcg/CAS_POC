import csv
from Levenshtein import distance
from fuzzywuzzy import fuzz
from typing import List, Dict, Tuple
import pandas as pd

class DuplicateDetector:
    def __init__(self, threshold: float = 70.0, max_rows: int = 100):
        """
        Initialize the DuplicateDetector.
        
        Args:
            threshold (float): Minimum fuzzy match score to consider as duplicate (0-100)
            max_rows (int): Maximum number of rows to process
        """
        self.threshold = threshold
        self.max_rows = max_rows

    def read_csv(self, file_path: str) -> List[str]:
        """
        Read material descriptions from CSV file.
        
        Args:
            file_path (str): Path to the CSV file
            
        Returns:
            List[str]: List of material descriptions
            
        Raises:
            Exception: If the CSV file doesn't contain the Material_Description column
        """
        try:
            # Read CSV using pandas
            df = pd.read_csv(file_path)
            
            # Check if Material_Description column exists
            if 'Material_Description' not in df.columns:
                raise Exception("CSV file must contain a 'Material_Description' column")
            
            # Get the Material_Description column and convert to string
            materials = df['Material_Description'].astype(str).tolist()
            
            # Remove any empty strings or NaN values
            materials = [m for m in materials if m and m.lower() != 'nan']
            
            # Limit to max_rows
            return materials[:self.max_rows]
            
        except Exception as e:
            raise Exception(f"Error reading CSV file: {str(e)}")

    def find_duplicates(self, materials: List[str]) -> List[Dict]:
        """
        Find potential duplicates in the list of materials.
        
        Args:
            materials (List[str]): List of material descriptions
            
        Returns:
            List[Dict]: List of duplicate matches with their scores
        """
        matches = []
        
        # Convert all materials to lowercase for comparison
        materials_lower = [m.lower() for m in materials]
        
        # Compare each material with every other material
        for i in range(len(materials)):
            for j in range(i + 1, len(materials)):
                material1 = materials[i]
                material2 = materials[j]
                
                # Calculate Levenshtein distance
                lev_dist = distance(material1.lower(), material2.lower())
                
                # Calculate fuzzy match score
                fuzzy_score = fuzz.ratio(material1.lower(), material2.lower())
                
                # Only include matches above threshold
                if fuzzy_score >= self.threshold:
                    matches.append({
                        'material1': material1,
                        'material2': material2,
                        'levenshtein_distance': lev_dist,
                        'fuzzy_score': fuzzy_score
                    })
        
        # Sort matches by fuzzy score in descending order
        matches.sort(key=lambda x: x['fuzzy_score'], reverse=True)
        
        return matches

    def process_file(self, file_path: str) -> List[Dict]:
        """
        Process a CSV file and find duplicates.
        
        Args:
            file_path (str): Path to the CSV file
            
        Returns:
            List[Dict]: List of duplicate matches with their scores
        """
        # Read materials from CSV
        materials = self.read_csv(file_path)
        
        # Find duplicates
        matches = self.find_duplicates(materials)
        
        return matches

def main():
    """
    Example usage of the DuplicateDetector class.
    """
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python duplicate_detector.py <csv_file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    try:
        detector = DuplicateDetector()
        matches = detector.process_file(file_path)
        
        if not matches:
            print("No duplicates found.")
            return
        
        print("\nDuplicate Analysis Results:")
        print("-" * 80)
        print(f"{'Material 1':<30} {'Material 2':<30} {'Levenshtein':<12} {'Fuzzy Score':<12}")
        print("-" * 80)
        
        for match in matches:
            print(f"{match['material1'][:30]:<30} {match['material2'][:30]:<30} "
                  f"{match['levenshtein_distance']:<12} {match['fuzzy_score']:<12}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 