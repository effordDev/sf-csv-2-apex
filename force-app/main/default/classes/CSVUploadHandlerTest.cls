@isTest
public with sharing class CSVUploadHandlerTest {

    @isTest
    private static void GetControllerDataTest() {
        CSVUploadHandler.ControllerInput request = new CSVUploadHandler.ControllerInput();
            request.template = 'Contact';
            CSVUploadHandler.GetControllerData( request );
    }

    @isTest
    private static void UploadDataTest() {

        CSVUploadHandler.UploadDataRequest request = new CSVUploadHandler.UploadDataRequest();
        request.template = 'Contact';
        request.rows = new List<CSVUploadHandler.RowData>();

        CSVUploadHandler.RowData rowData = new CSVUploadHandler.RowData();
            rowData.rowId = 'myRowId';
        request.rows.add(rowData);

        CSVUploadHandler.UploadData( request );
    }

    @istest
    private static void uploadCSVFileTest() {
        CSVUploadHandler.UploadCSVFileRequest newRequest = new CSVUploadHandler.UploadCSVFileRequest();
        newRequest.csvString = 'test';
        newRequest.fileName = 'test.txt';
        CSVUploadHandler.UploadCSVFile( newRequest );
        System.Assert( ![SELECT ID FROM ContentVersion].isEmpty(), 'File not uploaded');
    }

    @isTest
    private static void errorTests() {

        CSVUploadHandler.ControllerInput controllerInputRequest = new CSVUploadHandler.ControllerInput();
        CSVUploadHandler.GetControllerData( controllerInputRequest );
        
        CSVUploadHandler.UploadCSVFileRequest uploadCSVFileRequest = new CSVUploadHandler.UploadCSVFileRequest();
        CSVUploadHandler.UploadCSVFile( uploadCSVFileRequest );

        CSVUploadHandler.UploadDataRequest uploadDataRequest = new CSVUploadHandler.UploadDataRequest();
        CSVUploadHandler.UploadData( uploadDataRequest );
    }
}