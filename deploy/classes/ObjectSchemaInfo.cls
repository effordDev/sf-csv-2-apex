public with sharing class ObjectSchemaInfo {

    public static List<FieldInfo> GetData( String objectName, Set<String> fields ) {
        List<FieldInfo> fieldInfoList = new List<FieldInfo>();
        Map<String, Schema.SObjectField> fieldMap = GetObjectFieldMap( objectName );
        for( string field : fields ) {
            Schema.SObjectField objectField = fieldMap.get( field );
            if( objectField != null ) {
                FieldInfo newFieldInfo = new FieldInfo();
                newFieldInfo.api = field;
                newFieldInfo.objectName = objectName;

                Schema.DescribeFieldResult describeResult = objectField.getDescribe();
                newFieldInfo.label = describeResult.getLabel();

                Schema.DisplayType fieldType = describeResult.getType();
                newFieldInfo.type = String.valueOf( fieldType );
                switch on fieldType {
                    when Picklist {
                        newFieldInfo.picklists = new List<String>();
                        for (Schema.PicklistEntry pv : describeResult.getPickListValues()) {
                            newFieldInfo.picklists.add( pv.getValue().toUpperCase() );
                        }
                    }
                    when String {
                        newFieldInfo.maxLength = describeResult.getLength();
                    }
                    when TextArea {
                        newFieldInfo.maxLength = describeResult.getLength();
                    }
                }
                fieldInfoList.add( newFieldInfo );
            }
        }
        return fieldInfoList;
    }

	private static Map<String, Schema.SObjectField> GetObjectFieldMap( string objectName ) {
        Map<String,Schema.SObjectType> gd = Schema.getGlobalDescribe(); 
        return gd.get(objectName.toLowerCase()).getDescribe().fields.getMap();   
	}

    public class FieldInfo {
        public string label;
        public string api;
        public string objectName;
        public string type;
        public Integer maxLength;
        public List<String> picklists;        
    }
}