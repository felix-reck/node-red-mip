function workplaceBody(workplace,state,timestamp, automaticParameter, format){

    let ts = timestamp ?? new Date(); //either provide date or current date is being used

    const body =  {
    "params": [
        {
            "acronym": "service.logging_ts",
            "value": ts,
            "operator": "EQUAL"
        },
        {
            "acronym": "workplace.id",
            "value": workplace,
            "operator": "EQUAL"
        },
        {
            "acronym": "workplace.status.id",
            "value": state,
            "operator": "EQUAL"
        },
        {
            "acronym": "workplace.status.automatic",
            "value": automaticParameter,
            "operator": "EQUAL"
        }
    ],
    "columns": []
    }
    
    return { ...body, returnAsObject: format === 'returnAsObject' };;
}

function customBody(body,format){

    if (typeof body == 'string') {
        try {
            body = JSON.parse(body)
        } catch (error) {

            return false;

        }
    }
    return { ...body, returnAsObject: format === 'returnAsObject' };
}



module.exports = {
    workplaceBody,
    customBody
}