function workplaceBody(workplace,state, timestamp){

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
        }
    ],
    "columns": [],
    "returnAsObject": false
    }
    
    return body;
}

function customBody(body){

    if (typeof body == 'string') {
        try {
            body = JSON.parse(body)
        } catch (error) {

        }
    }
    return body;
}



module.exports = {
    workplaceBody,
    customBody
}