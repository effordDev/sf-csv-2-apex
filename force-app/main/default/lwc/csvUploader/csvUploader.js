import { api, LightningElement } from 'lwc';
import GetControllerData from '@salesforce/apex/CSVUploadHandler.GetControllerData';
import HandleCSVUpload from '@salesforce/apex/CSVUploadHandler.UploadCSVFile';
import HandleDataUpload from '@salesforce/apex/CSVUploadHandler.UploadData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getCSVText, getParsedCSVFromString } from 'c/csvParserUtils';

//if changed update value in csvParser as well
const rowOffset = 3;

export default class CsvUploader extends LightningElement {
    @api recordId = ''

    loading = false;
    fields = [];
    errorRows = [];
    labels = {
        'CSVFile' : 'Upload File',
        'InvalidRecords' : 'Invalid Records',
        'Row' : 'Row #',
        'ErrorList' : 'Error List',
    } 
    selectedTemplate = 'Example_Template';

    get templateButtons() {
        return [
            { label: 'Example_Template', value : 'Example_Template' },
        ];
    }
    get disabledTemplateBtns() {
        return this.templateButtons.length <= 1
    }

    handleTemplateButtonClick( event ) {
        const { value } = event.currentTarget;
        this.selectedTemplate = value;
    }

    async getDataFromTemplate( template ) {
        try {
            const request = {
                template : template
            };
            const response = await GetControllerData({ request : request });
            const parsedResponse = JSON.parse( response );
            this.fields = parsedResponse.fields;
            console.log( this.fields );
            return true;
        }
        catch( e ) {
            this.showToastMessage( 'Server Error', e.body?.message, 'error', true );
            console.error( e );
        }
        return false;
    }

    async handleFileUpload( file, csvContents ) {
		const fileName = file.name;
		const request = {
			'csvString' : csvContents,
			'fileName' : fileName
		}
        const response = await HandleCSVUpload({request: request});
        return response;
    }

    async handleDataUpload( parsedCSV ) {

        const rows = parsedCSV.map( csvRow => {
            let data = csvRow.data;
            
            return {
                rowId: data.rowId,
            }
        });
        if( rows.length === 0 ) {
            this.showToastMessage( 'Error', 'No Rows Found', 'error', true );
            return;
        }
        const request = {
            rows : rows,
            template : this.selectedTemplate
        }
        //console.log( request );
        const response = await HandleDataUpload({request: request});
        this.handleServerResponse( response );
    }

    async handleUploadFinished( event ) {
		const FILES = event?.target?.files;
		if (FILES && FILES.length > 0) {
			try{
                this.loading = true;
                this.errorRows = [];
                const file = event.target.files[0];
                //console.log( this.selectedTemplate );
                const gotDataSuccessfully = await this.getDataFromTemplate( this.selectedTemplate );

                console.log({
                    gotDataSuccessfully
                })

                if( gotDataSuccessfully ) {
                    const csvContents = await getCSVText( file );
                    let parsedCSV = await getParsedCSVFromString( csvContents, this.fields );

                    console.log({
                        parsedCSV
                    })
                    
                    if( parsedCSV ) {
                        parsedCSV = this.updateParsedCsvWithCustomErrors( parsedCSV );
                        let rowNumber = rowOffset;
                        parsedCSV.forEach( parsedResult => {
                            if( parsedResult.errors.length > 0 ) {
                                this.errorRows.push(  { 
                                    rowNumber : rowNumber,
                                    errors : parsedResult.errors
                                });
                            }
                            rowNumber++;
                        });
                        this.errorRows = [...this.errorRows ];
                        if( !this.errorRows.length ) {
                            const fileUploadResponse = await this.handleFileUpload( file, csvContents );
                            if( fileUploadResponse?.success ) {
                                await this.handleDataUpload( parsedCSV );
                            } else {
                                this.showToastMessage( 'Server Error', fileUploadResponse?.errorMessage, 'error', true );
                            }
                        }
                    } else {
                        this.showToastMessage( 'File Error', 'No Rows Found', 'error', true );
                    }
                }
			}
			catch( e ) {
				console.warn( e );
			}
			finally {
				this.loading = false;
                this.dispatchEvent(new CustomEvent('datauploaded'))
			}
		}
	}

    updateParsedCsvWithCustomErrors( parsedCSV ) {
        try {
            if ( this.selectedTemplate === 'Example_Template' ) {
                return this.handleExamplePostValidation( parsedCSV );
            } 
        } catch( e ) {
            console.error( e );
            return parsedCSV;
        }
        return parsedCSV;
    }

    handleExamplePostValidation(parsedCSV) {
        return parsedCSV
        // return parsedCSV.map(parsedResult => {
        //     const rowData = parsedResult.data
        //     let errorList = parsedResult.errors

        //     const rowId = rowData.rowId
        //     this.addErrorIfBlank( errorList, 'Row Id', rowId );
        // })
    }

    addErrorIfBlank( errorList, fieldName, fieldValue ) {
        if( !this.isEmptyString( fieldValue ) ) return;
        this.addErrorToList( errorList, `${fieldName} is required`);
    }

    addErrorIfLessThanMinLength( errorList, fieldName, fieldValue, minLength ) {
        if( fieldValue?.length >= minLength ) return;
        this.addErrorToList( errorList, `${fieldName} must be at least ${minLength} characters` );
    }

    addErrorToList( errorList, errorMessage ) {
        errorList.push( errorMessage );
    }

    isEmptyString( text ) {
        return text === undefined || text === '';
    }

    handleServerResponse( response ) {
        if( response?.success ) {
            this.showToastMessage( 'Success!', '', 'success' );
        } else {
            this.showToastMessage( 'Server Error', response?.errorMessage, 'error', true );
        }
    }

    addToListIfNotNull( list, element ) {
        if( element != null ) {
            list.push( element );
        }
    }

    showToastMessage( title, message, variant, sticky=false ) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
			mode : sticky ? 'sticky' : ''
        });
        this.dispatchEvent(evt);
    }
}