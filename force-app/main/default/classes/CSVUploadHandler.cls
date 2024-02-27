public with sharing class CSVUploadHandler {
    
    public class CSVUploadHandlerException extends Exception {}

    @AuraEnabled(cacheable=true)
    public static string GetControllerData( ControllerInput request ) {
        ControllerOutput newControllerOutput = new ControllerOutput();
        newControllerOutput.fields = CSVFieldsHelper.GetFieldsFromTemplate( request.template );
        return JSON.serialize( newControllerOutput );
    }

    public class ControllerInput {
        @AuraEnabled
        public string template{get;set;}
    }

    public class ControllerOutput {
        @AuraEnabled
        public List<CSVFieldsHelper.CSV_Field_Info> fields{get;set;}
    }

    //File Upload
    @AuraEnabled
    public static UploadCSVFileResponse UploadCSVFile( UploadCSVFileRequest request ){
        UploadCSVFileResponse response = new UploadCSVFileResponse();
        Savepoint sp = Database.setSavepoint();
        try {
            if( IsValidRequest( request ) ) {            
                CreateFiles( request );
                response.success = true;
                // Database.rollback(sp);
                return response;
            } else { response.errorMessage = 'Invalid Request'; }
        } catch (Exception e) { 
            response.errorMessage = e.getMessage();
            Database.rollback(sp);
        }
        response.success = false;
        return response;
    }

    public class UploadCSVFileRequest {
        @AuraEnabled
        public string csvString {get;set;}

        @AuraEnabled
        public string fileName {get;set;}
    }

    
    public class UploadCSVFileResponse {
        @AuraEnabled
        public Boolean success{get;set;}

        @AuraEnabled
        public string errorMessage{get;set;}

        public UploadCSVFileResponse() {
            this.success = false;
        }
    }

    private static Boolean IsValidRequest( UploadCSVFileRequest request ) {
        return request != null 
        && !String.isBlank( request.csvString )
        && !String.isBlank( request.fileName );
    }

    private static Boolean IsValidRequest( UploadDataRequest request ) {
        return request != null 
        && !request.rows.isEmpty()
        && !String.isEmpty( request.template );
    }

    private static void CreateFiles( UploadCSVFileRequest request ) {
        ContentVersion csvFile = CreateContentVersion( request.csvString, request.fileName );
        insert csvFile;
    }

    private static ContentVersion CreateContentVersion ( string csvString, string fileName ) {
        Blob data = Blob.valueof( csvString );
        ContentVersion v = new ContentVersion();
            v.ContentLocation   = 'S';
            v.PathOnClient      = fileName;
            v.Title             = fileName;
            v.VersionData       = data;
        return v;
    }
    
    public class UploadDataResponse {
        @AuraEnabled
        public Boolean success{get;set;}

        @AuraEnabled
        public string errorMessage{get;set;}

        public UploadDataResponse() {
            this.success = false;
        }
    }

    public class RowData {
        @AuraEnabled
        public String rowId {get;set;}
    }

    public class UploadDataRequest {
        @AuraEnabled
        public List<RowData> rows {get;set;}

        @AuraEnabled
        public string template {get;set;}
    }

    //Data Upload
    @AuraEnabled
    public static UploadDataResponse UploadData( UploadDataRequest request ) {
        UploadDataResponse response = new UploadDataResponse();
        Savepoint sp = Database.setSavepoint();
        try {
            if( IsValidRequest( request ) ) {
                final string template = request.template;
                List<RowData> rows = request.rows;

                switch on template {
                    when 'Example_Template' {
                        ExampleHandler( rows );
                    }
                }
                response.success = true;
                //Database.rollback(sp);
            }
        }
        catch (Exception e) {
            Database.rollback(sp);
            response.success = false;
            response.errorMessage = e.getMessage();
        }
        return response;
    }

    private static void ExampleHandler( List<RowData> rows ) {
        //process row data
    }
}