---
name: CTRLx Ontology Graph
description: The schema and governance rules for the JSON-based Ontology Graph Router used by the CTRLx Smart Gateway. Includes XPath patterns and inheritance heuristics.
---

# CTRLx Ontology Graph Router

The CTRLx Smart Gateway has transitioned away from a flat SharePoint list ("Schema Rules") to a high-speed, in-memory **Ontology Graph Router** based on a single `Ontology.json` file.

## 1. File Location
The master ontology file is maintained in the SharePoint Document Library:
`https://mympc.sharepoint.com/sites/mplxcontrols/Agent_KB/Ontology.json`

## 2. Schema Structure
The schema is designed as an **Array of Objects** rather than a dictionary. This is specifically optimized so Power Automate can traverse it using `xpath()` without needing to decode XML node names.

```json
{
  "root": {
    "OntologyVersion": "1.0.0",
    "Classes": [
      {
        "ClassId": "WorkItem",
        "Inherits": "Entity",
        "Description": "An abstract base class.",
        "Predicates": [
          {
            "PredicateId": "has_status",
            "DataType": "Choice",
            "Options": ["Active", "Blocked"],
            "Cardinality": "Single"
          }
        ]
      }
    ]
  }
}
```

### Cardinality Options
- **`Single`**: Only the newest Triple for this predicate is valid (Z-Index overwrite). Used for stateful things like Status or Budget.
- **`Multiple`**: All Triples for this predicate aggregate together. Used for arrays like `depends_on` or `assigned_to`.

## 3. The XPath Extraction Pattern
To dynamically retrieve all valid predicates for a specific Class (including everything it inherits), Power Automate uses this exact XPath expression:

```
xpath(xml(outputs('Get_Ontology')), '//Classes[ClassId="Project" or contains(//Classes[ClassId="Project"]/Inherits, ClassId)]/Predicates/*')
```

**How it works**: The `Inherits` property is a comma-separated string (e.g., `"Entity, WorkItem"`). The `contains()` function allows the XPath engine to simultaneously pull predicates from the target class *and* all classes listed in its inheritance string, without recursion.

## 4. Ontology Governance Rules (Strict)

When the user asks you to modify the Ontology or add new rules, you **MUST** follow these heuristics:

1. **When to create a Base Class** (e.g., `Entity`, `Team`)
   Create a new Base Class only for foundational, distinct nouns that do not share core predicates with existing things.
   
2. **When to use Inheritance** (e.g., `Project`, `Task`)
   If a new concept shares 60%+ of its predicates with an existing class, it should be a new Class that inherits the base (e.g., `Inherits: "Entity, WorkItem"`). Do not duplicate predicates across classes if they can be inherited.

4. **NEVER Create a Class for State (The State Trap)**
   Never create a class to represent a state or a phase (e.g., `ActiveProject` or `CompletedTask`). State is data. State is handled by adding options to the `has_status` Predicate. Classes are strictly for defining structural types of nouns.

## 5. Deployment Instructions (Automated)

When you modify the `Ontology.json` file, you **MUST** automatically push it to the SharePoint environment so the changes go live. 

Use the existing deployment script located at:
`c:\Users\FW97\OneDrive - Marathon Petroleum\Documents\TwFw\Scripts\Deploy-Ontology.ps1`

Run the script using your terminal tool:
`pwsh -File Scripts\Deploy-Ontology.ps1`

Always read the output log (`.logs/deploy_ontology.log`) using `view_file` to verify the deployment was successful, in accordance with the environment constraints.
