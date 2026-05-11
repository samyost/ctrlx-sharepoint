---
name: SharePoint HTTP Requests Cheat Sheet
description: A cheat sheet for HTTP requests to SharePoint (REST API), covering list creation, navigation, columns, views, items, permissions, and groups. Use when building HTTP requests to SharePoint in Power Automate or other tools.
---

# HTTP requests to SharePoint cheat sheet

**Author:** Tom Riha | 2025 | ver. 1.1

## General note

You can reference the SharePoint list in two ways in all the requests, it is up to you which way you prefer:

1. Get the list by the title: `_api/web/lists/getByTitle('<listName>')`

2. Get the list by guid: `_api/web/lists('<listGuid>')`

## SharePoint lists & libraries

### Create new SharePoint list (empty)

* **Method:** POST

* **Request:** `_api/web/lists/`

* **Header:**


  {
    "accept": "application/json;odata=verbose",
    "content-type": "application/json;odata=verbose"
  }


* **Body:**


  
  {
    "__metadata": { "type": "SP.List" },
    "Title": "<listName>",
    "Description": "<listDescription>",
    "BaseTemplate": 100
  }
  


* **Valuable outputs:**

  * List id: `body('Send_an_HTTP_request_to_SharePoint')?['d']?['Id']`

  * List name: `body('Send_an_HTTP_request_to_SharePoint')?['d']?['Title']`

### Create new SharePoint library (empty)

* **Method:** POST

* **Request:** `_api/web/lists/`

* **Header:** Same as Create List

* **Body:**


  {
    "__metadata": { "type": "SP.List" },
    "Title": "<libraryName>",
    "Description": "<libraryDescription>",
    "BaseTemplate": 101
  }
  


* **Valuable outputs:**

  * Library id: `body('Send_an_HTTP_request_to_SharePoint')?['d']?['Id']`

  * Library name: `body('Send_an_HTTP_request_to_SharePoint')?['d']?['Title']`

### Create new SharePoint list from an existing one

#### 1. Get list as a template

* **Method:** POST

* **Request:** `_api/Microsoft.Sharepoint.Utilities.WebTemplateExtensions.SiteScriptUtility.GetSiteScriptFromList`

* **Header:** Same as above

* **Body:**


  {
    "listUrl": "<fullListUrl>"
  }
  


* **Valuable outputs:** List schema: `body('Send_an_HTTP_request_to_SharePoint')?['d']?['GetSiteScriptFromList']`

#### 2. Create list from a template

* **Method:** POST

* **Request:** `_api/Microsoft.Sharepoint.Utilities.WebTemplateExtensions.SiteScriptUtility.ExecuteTemplateScript()`

* **Header:** Same as above

* **Body:** Includes JSON schema script replaced with dynamic listName parameters.

* **Valuable outputs:**

  * List url: `body('Send_an_HTTP_request_to_SharePoint_create_list')?['d']?['ExecuteTemplateScript']?['results'][0]?['Target']`

  * List id: `body('Send_an_HTTP_request_to_SharePoint_create_list')?['d']?['ExecuteTemplateScript']?['results'][0]?['TargetId']`

## Navigation & Settings

### Add list / library to navigation

**Get navigation node id:**

* **Method:** GET

* **Request:** `_api/web/navigation/quickLaunch?$filter=Title eq '<nodeName>'`

* **Outputs:** Navigation node id: `first(body('Send_an_HTTP_request_to_SharePoint')?['d']?['results'])?['Id']`

**Add list / library as sublink to navigation:**

* **Method:** POST

* **Request:** `_api/web/navigation/getNodeById(<navigationNodeId>)/children`

* **Header:** Same as above

* **Body:**


  {
    "__metadata": { "type": "SP.NavigationNode" },
    "Title": "<linkTitle>",
    "Url": "<url>"
  }
  


### Change list name

* **Method:** POST

* **Request:** `_api/web/lists/getByTitle('<currentListName>')`

* **Header:**


  {
    "Accept": "application/json;odata=verbose",
    "Content-Type": "application/json;odata=verbose",
    "IF-MATCH": "*",
    "X-HTTP-Method": "MERGE"
  }
  


* **Body:**


  {
    "__metadata": { "type": "SP.List" },
    "Title": "<newListName>"
  }
  


## Columns & Views

### Add new column

**Get XML schema of an existing column:**

* **Method:** GET

* **Request:** `_api/web/lists/getByTitle('<listName>')/fields/getByTitle('<fieldName>')/SchemaXml`

* **Outputs:** Column schema XML: `body('Send_an_HTTP_request_to_SharePoint')?['d']?['SchemaXml']`

**Create column from an XML schema:**

* **Method:** POST

* **Request:** `_api/web/lists/getByTitle('<listName>')/fields/createfieldasxml`

* **Body:**


  {
    "parameters": {
      "__metadata": { "type": "SP.XmlSchemaFieldCreationInformation" },
      "SchemaXml": "<columnSchemaXML>"
    }
  }
  


### Create new view on list / library

* **Method:** POST

* **Request:** `_api/web/lists/getByTitle('<listName>')/views`

* **Body:**


  {
    "__metadata": { "type": "SP.View" },
    "ViewType": "HTML",
    "Title": "<viewName>",
    "PersonalView": false
  }
  


*(To include a filter, add `"ViewQuery": "<viewQuery>"` to the body, where `<viewQuery>` contains CAML XML syntax like `<Where><Eq>...`)*

### Add column to a view

* **Method:** POST

* **Request:** `_api/web/lists/getByTitle('<listName>')/views/getByTitle('<viewName>')/viewFields/addViewField('<columnName>')`

## SharePoint Items

### Create new item

* **Method:** POST

* **Request:** `_api/web/lists/getByTitle('<listName>')/items`

* **Body:**


  {
    "__metadata": { "type": "SP.Data.<listName>ListItem" },
    "<columnName>": "<columnValue>",
    "<columnName2>": "<columnValue2>"
  }
  


* **Outputs:** Item id: `body('Send_an_HTTP_request_to_SharePoint')?['d']?['Id']`

### Update item (ValidateUpdateListItem)

* **Method:** POST

* **Request:** `_api/web/lists/getByTitle('<listName>')/items(<itemId>)/validateUpdateListItem`

* **Body:**


  {
    "formValues": [
      { "FieldName": "<fieldToUpdate>", "FieldValue": "<valueToUpdate>" }
    ]
  }
  


*(To update without creating a new version, add `"bNewDocumentUpdate": true` to the JSON payload.)*

### ValidateUpdateListItem format per column type

* **Single/Multiple lines of text:** `"FieldValue": "<text>"`

* **Choice:** `"FieldValue": "<choice>"`

* **Multiple choice:** `"FieldValue": "<choice1>;#<choice2>"`

* **Number:** `"FieldValue": "<number>"`

* **Date:** `"FieldValue": "<date in format 'MM-dd-yyyy'>"`

* **Yes/No:** `"FieldValue": "<1 (Yes)/0 (No)>"`

* **User:** `"FieldValue": "[{'Key':'i:0#.f|membership|<email>'}]"`

* **Multiple users:** `"FieldValue": "[{'Key':'i:0#.f|membership|<email1>'}, {'Key':'i:0#.f|membership|<email2>'}]"`

* **Lookup:** `"FieldValue": "<lookupID>"`

* **Managed metadata:** `"FieldValue": "<termName>|<termId>"`

### Special updatable SharePoint fields

* **Created By:** `"FieldName": "Author"`, `"FieldValue": "[{'Key':'i:0#.f|membership|<newAuthorEmail>'}]"`

* **Modified By:** `"FieldName": "Editor"`

* **File name:** `"FieldName": "FileLeafRef"`

### Remove file completely (even from recycle bin)

1. **Get recycle bin id:** GET `_api/web/RecycleBin?$filter=LeafName eq '<fileNameWithExtension>'&$select=Id`

2. **Remove the file:** DELETE `_api/web/RecycleBin('<fileId>')`

### Working with item / file versions

**Get previous version:**

* **Method:** GET

* **Request:** `_api/web/lists/getByTitle('<listName>')/items(<itemId>)/Versions?$filter=versionLabel eq '<versionNumber>'`

## SharePoint Permissions

### Break permission inheritance

* **On list / library:** POST `_api/web/lists/getByTitle('<listName>')/breakroleinheritance(true)`

* **On specific item / document:** POST `_api/web/lists/getByTitle('<listName>')/items(<itemId>)/breakroleinheritance(true)`

### Get items / files with unique permissions

* **Method:** GET

* **Request:** `_api/web/lists/getByTitle('<list/libraryName>')/items?$select=HasUniqueRoleAssignments,Id`

### Restore permission inheritance

* **On list / library:** POST `_api/web/lists/getByTitle('<listName>')/resetRoleInheritance()`

* **On specific item / document:** POST `_api/web/lists/getByTitle('<listName>')/items(<itemId>)/resetRoleInheritance()`

### Identifiers

* **Get user id:** GET `_api/web/siteUsers/getByEmail('<userEmailAddress>')/Id`

* **Get SharePoint group id:** GET `_api/web/siteGroups/getByName('<SPGroupName>')/Id`

* **Get M365 security group id:** GET `_api/web/siteusers?$filter=Title eq '<securityGroupName>'`

* **Get permission level id:** GET `_api/web/roledefinitions/GetByName('<permissionLevelName>')`

### Add permissions to user or group

* **On list / library:** POST `_api/web/lists/getByTitle('<listName>')/roleAssignments/addRoleAssignment(principalId=<userOrGroupId>, roleDefId=<permissionLevelId>)`

* **On specific item:** POST `_api/web/lists/getByTitle('<listName>')/items(<itemId>)/roleAssignments/addRoleAssignment(...)`

### Default SharePoint IDs

* **Permission levels:** Full Control (1073741829), Design (1073741828), Edit (1073741830), Contribute (1073741827), Read (1073741826), View (1073741832).

* **Groups:** Owners (3), Visitors (4), Members (5).

### List & Remove permissions

* **List (List/Library):** GET `_api/web/lists/getByTitle('<listName>')/roleassignments`

* **List (Specific User/Group):** GET `_api/web/roleAssignments/getByPrincipalId(<principalId>)/roleDefinitionBindings`

* **Remove (List/Library):** POST `_api/web/lists/getByTitle('<ListName>')/roleassignments(<principalId>)` with `"X-HTTP-Method": "DELETE"` in Header.

## SharePoint Groups

### Create new SharePoint group

* **Method:** POST

* **Request:** `_api/web/siteGroups`

* **Body:**


  {
    "__metadata": { "type": "SP.Group" },
    "Title": "<groupName>",
    "Description": "<groupDescription>"
  }
  


### Manage members & permissions

* **Add site permissions for SP group:** POST `_api/web/roleAssignments/addRoleAssignment(principalId=<SPgroupId>,roleDefId=<permissionLevelId>)`

* **Add user to SP group:** POST `_api/web/siteGroups/GetById(<groupId>)/users` (Pass `LoginName` in body).

* **List all members in SP group:** GET `_api/web/siteGroups/getById(<groupId>)/users`

* **Remove user from SP group:** POST `_api/web/siteGroups/getById(<groupId>)/users/getById(<userId>)` with `"X-HTTP-Method": "DELETE"` in Header.
