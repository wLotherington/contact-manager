# Contact Manager

## Overview
Contact manager application.
* Leverages a node API server to manage contact data
* allows for adding, deleting, and filtering contacts
* tags can be entered as comma seperated values

## Improvement Opportunities
* Add form validation
* Check for redundant contacts
* allow tags to be upper and lower case
* allow for easier entering of existing tags
* Have the ```Contact``` object handle more of the flagging/unflagging for contact filtering
* Move ```Tag``` related methods (filtering, showing) to ```TagManager``` Object
* Move ```Contact``` related methods (filtering, delete, showing) to ```ContactManager``` Object

## Known Bugs
* Filtering by name shows blank screen if you type in invalid char sequence then click backspace
* If you are on the Add/Edit form screen and filter by tag or click the "view all contacts" button, nothing happens.