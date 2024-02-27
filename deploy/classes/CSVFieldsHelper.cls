public with sharing class CSVFieldsHelper {

    public class CSVFieldsHelperException extends Exception {}

    private static final string NO_OBJECT = 'NONE';

    public static List<CSV_Field_Info> GetFieldsFromTemplate( string template ) {

        Map<String,Set<String>> objectToFields = new Map<String,Set<String>>();
        List<CSV_Field__mdt> csvFields = GetCSVFields( template );
        for( CSV_Field__mdt csvField : csvFields ) {
            PopulateSetOfStringMap( objectToFields, csvField.Object__c, csvField.Api__c );
        }

        Map<String, ObjectSchemaInfo.FieldInfo> fieldKeyToFieldInfo = new Map<String, ObjectSchemaInfo.FieldInfo>();
        for( string objectName : objectToFields.keySet() ) {
            if( objectName != NO_OBJECT ) {
                List<ObjectSchemaInfo.FieldInfo> fieldInfos = ObjectSchemaInfo.GetData( objectName, objectToFields.get( objectName ));
                for( ObjectSchemaInfo.FieldInfo fieldInfo : fieldInfos ) {
                    fieldKeyToFieldInfo.put( GetUniqueKey( fieldInfo ), fieldInfo );
                }
            }
        }

        List<CSV_Field_Info> newCsvFieldInfos = new List<CSV_Field_Info>();
        for( CSV_Field__mdt csvField : csvFields ) {
            CSV_Field_Info newCSVFieldInfo = new CSV_Field_Info( csvField );
            if( csvField.Object__c != NO_OBJECT ) {
                final String uniqueKey = GetUniqueKey( csvField );
                ObjectSchemaInfo.FieldInfo newFieldInfo = fieldKeyToFieldInfo.get( uniqueKey );
                if( newFieldInfo == null ) {
                    throw new CSVFieldsHelperException( uniqueKey + ' does not exist' );
                }
                newCSVFieldInfo.fieldInfo = newFieldInfo;
            } else {
                newCSVFieldInfo.fieldInfo = GetFieldInfoFromFakeField( csvField );
            }
            newCsvFieldInfos.add( newCSVFieldInfo );
        }
        return newCsvFieldInfos;
    }
    
    private static ObjectSchemaInfo.FieldInfo GetFieldInfoFromFakeField( CSV_Field__mdt csvField ) {
        ObjectSchemaInfo.FieldInfo fieldInfo = new ObjectSchemaInfo.FieldInfo();
        fieldInfo.label = csvField.MasterLabel;
        fieldInfo.api = csvField.Api__c;
        fieldInfo.objectName = csvField.Object__c;
        fieldInfo.type = 'String';
        fieldInfo.maxLength = 255;
        return fieldInfo;
    }

    private static string GetUniqueKey( ObjectSchemaInfo.FieldInfo fieldInfo ) {
        return GetUniqueKey( fieldInfo.objectName, fieldInfo.api );
    }

    private static string GetUniqueKey( CSV_Field__mdt csvField ) {
        return GetUniqueKey( csvField.Object__c, csvField.Api__c );
    }

    private static string GetUniqueKey( string objectName, string api ) {
        return objectName + '.' + api;
    }

    public static void PopulateSetOfStringMap( Map<String, Set<String>> mapList, string key, string value ) {
        if( key != null ) {
            Set<String> currentList = mapList.get( key );
            if( currentList == null ) {
                mapList.put( key, new Set<String>{ value } );
            } else {
                currentList.add( value );
            }
        }
    }

    private static List<CSV_Field__mdt> GetCSVFields( string template ) {
        return [
            SELECT Object__c, Api__c, Order__c, Identifier__c, Required__c, MasterLabel
            FROM CSV_Field__mdt
            WHERE Template__c = :template
            AND Active__c = true
            ORDER BY Order__c ASC
        ];
    }

    public class CSV_Field_Info {
        public ObjectSchemaInfo.FieldInfo fieldInfo;
        public string identifier;
        public Boolean required;

        public CSV_Field_Info( CSV_Field__mdt fieldMetaData ) {
            this.identifier = String.isBlank( fieldMetaData.Identifier__c ) ? 'new' + fieldMetaData.Object__c : fieldMetaData.Identifier__c;
            this.required = fieldMetaData.Required__c;
        }
    }

}