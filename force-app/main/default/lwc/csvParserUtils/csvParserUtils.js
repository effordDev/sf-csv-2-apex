function fileToText(file) {
    return 	new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

function csvParser(str) {
    let arr = [];
    let quote = false;
    for (let row= 0,col= 0,c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';
        
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
        if (cc == '"') { quote = !quote; continue; }
        if (cc == ',' && !quote) { ++col; continue; }
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        
        arr[row][col] += cc;
    }
    return arr;
}

function getParseResults( csvFile, fields ) {
    if( !csvFile || !fields ) {
        return undefined;
    }

    let parseResults = [];
    const rows = csvParser( csvFile );
    if( rows ) {
        const rowOffset = getRowOffset();
        for( let i = rowOffset; i < rows.length; i++ ) {
            let parseResult = {
                data : {},
                errors : []
            }        
            let isEmptyRow = true;
            const row = rows[i];
			if( fields ) {
                const COLUMN_OFFSET = 0;
                let fieldIndex = COLUMN_OFFSET;
				fields.forEach( field => {
                    const fieldInfo = field.fieldInfo;
                    const required = field.required;
					const evaluation = evaluateField( row[fieldIndex], fieldInfo, required );
                    const value = evaluation.value
                    const identifier = field.identifier;
                    const fieldApi = fieldInfo.api;
                    if( parseResult.data[identifier] === undefined ) {
                        parseResult.data[identifier] = {};
                    }
                    parseResult.data[identifier][fieldApi] = value;
                    if( evaluation.errors.length ) {
                        evaluation.errors.forEach( error => {
                            parseResult.errors.push( error );
                        });
                    }
                    if( value ) {
                        isEmptyRow = false;
                    }
                    fieldIndex++;
 				});
                if( !isEmptyRow ) {
                    parseResults.push( parseResult );
                }
			}
        }
    }

    return parseResults;
}

function evaluateField( value, fieldInfo, required ) {

    console.log({
        value,
        fieldInfo,
        required
    })

    let evaluation = {
        value : undefined,
        errors : []
    }

    value = value === undefined ? '' : value

    if( value !== undefined ) {
        let cleanValue = value.replace( '\r', '' ).trim();
        evaluation.value = cleanValue;

        if( fieldInfo ) {
            const fieldName = fieldInfo.label;
            const type = fieldInfo.type;
            if( required && isEmptyString( cleanValue ) ) {
                evaluation.errors.push( `${fieldName} is required.` );
            }

            if( isText( type ) ) {
                const maxLength = fieldInfo.maxLength;
                if( maxLength !== undefined ) {
                    updateEvaluation( evaluation, evaluateText( cleanValue, fieldName, maxLength ) );
                } 
            } else if( isNumber( type ) ) {
                updateEvaluation( evaluation, evaluateNumber( cleanValue, fieldName ) );
            } else if( isDate( type ) ) {
                updateEvaluation( evaluation, evaluateDate( cleanValue, fieldName ) );
            } else if ( isPicklist( type ) ) {
                const picklistValues = fieldInfo.picklists;
                if( picklistValues ) {
                    updateEvaluation( evaluation, evaluatePicklist( cleanValue, fieldName, picklistValues ) );
                }
            }
    
        }
    }

    return evaluation;
}

function updateEvaluation( currentEvaluation, fieldEvaluation ) {
    currentEvaluation.value = fieldEvaluation.value;
    if( !isEmptyString( fieldEvaluation.error ) ) {
        currentEvaluation.errors.push( fieldEvaluation.error );
    }
}

function isText( type ) {
    return type === 'STRING' || type === 'TEXTAREA';
}

function isNumber( type ) {
    return type === 'CURRENCY' || type === 'DOUBLE' || type === 'PERCENT';
}

function isDate( type ) {
    return type === 'DATE';
}

function isPicklist( type ) {
    return type === 'PICKLIST';
}

function getSFDateFromJsDate(date) {
	if ( !date || date.toString() === 'Invalid Date' ) {
		return undefined;
	}
	return `${date.getFullYear()}-${(date.getMonth() + 1)
		.toString()
		.padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function evaluateNumber( number, fieldName ) {
    let evaluation = {
        value : undefined,
        error : undefined
    };
    if( !isEmptyString( number ) ) {
        const numberString = number.replace(/[$,]/g, "");
        if( numberString === '' ) {
            evaluation.error = `${number} is not valid for ${fieldName}`; 
        } else {
            const newNumber = Number(numberString);
            if( isNaN( newNumber ) ) {
                evaluation.error = `${number} is not valid for ${fieldName}`;            
            } else {
                evaluation.value = newNumber;
            }
        }
    }
    return evaluation;
}

function evaluateText( text, fieldName, maxLength ) {
    let evaluation = {
        value : undefined,
        error : undefined
    };
    if( !isEmptyString( text ) ) {
        if( maxLength ) {
            if( text.length > maxLength ) {
                evaluation.error = `${fieldName} is too long. Max Length: ${maxLength}`;
            } else {
                evaluation.value = text;
            }
        }
    }
    return evaluation;
}

function evaluateDate( date, fieldName ) {
    let evaluation = {
        value : undefined,
        error : undefined
    };
    if( !isEmptyString( date ) ) {
        const cleanDate = getSFDateFromJsDate( new Date( date ) );
        if ( !cleanDate || cleanDate.toString() === 'Invalid Date' ) {
            evaluation.error = `${date} is not valid for ${fieldName}`;            
        } else {
            evaluation.value = cleanDate.toString();
        }
    }
    return evaluation;
}

function isEmptyString( text ) {
    return text === undefined || text === '';
}

function evaluatePicklist( picklistValue, fieldName, picklistValues ) {
    let evaluation = {
        value : undefined,
        error : undefined
    };
    if( !isEmptyString( picklistValue ) ) {
        const upperValue = picklistValue.toUpperCase();
        if( !picklistValues.includes( upperValue ) ) {
            evaluation.error = `${picklistValue} is not valid for ${fieldName}. Valid Options(${picklistValues.join( ',')})`;;            
        } else {
            evaluation.value = picklistValue;
        }
    }
    return evaluation;
}

function getRowOffset() {
    return 2;
}

async function getCSVText( file ) {
    if( !file ) {
        return undefined;
    }
    const csvContents = await fileToText( file );
    return csvContents;
}

async function getParsedCSVFromString( csvContents, fields ) {
    return getParseResults( csvContents, fields );
}

export { getParsedCSVFromString, getCSVText }