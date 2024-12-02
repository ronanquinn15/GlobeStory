//The URI of image upload
IUPS = "https://prod-08.uksouth.logic.azure.com:443/workflows/bfd6e8b4bf39442ab2606b99363f6711/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=8nOk2epLiyxh7PvxI1R3e1uxJb_Ib6AC8GTpNPY8UQc";

//The URI of the retrieve all images endpoint
RAI = "https://prod-00.uksouth.logic.azure.com/workflows/ca0d346342204e40b89a887c38ef1a4b/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/travel/%7Blangauge%7D?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=dPeWrzDmZvG2Yt6mwJP3lxFqfs7gYD-5AabI1dm_SvY";
//The URI of the delete image endpoint
DIAURI0 = "https://prod-30.uksouth.logic.azure.com/workflows/b76f4b1ebf5c43bdb130460d8579b9df/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/travel/";
DIAURI1 = "?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=zStvrDLDQ5y-KDqrJ4Xo1rVSVBTCFvUp4UTxfA3kOls";

//The URI of the retrieve image by ID endpoint
RIIURI0 = "https://prod-24.uksouth.logic.azure.com/workflows/ef1669ee408247c394067ae04e0345da/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/travel/";
RIIURI1 = "?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=U3kPTMO_3theeUxoLpNxyIti4U8SPIlvN11ag98dKGA";

//The URI of the update image by ID endpoint
UIAURI0 = "";
UIAURI1 = "";

//The URI of the Blob Storage Account
BLOB_ACCOUNT = "https://blobstoragerq.blob.core.windows.net";

// Constants for Azure Translator
const TRANS_KEY = "AnQq0WHTxK9dMbkZBHLJscXVshw9MKms2YWkbN2vxV8FDpN6WQAPJQQJ99AKAClhwhEXJ3w3AAAbACOGI2UP";  // Replace with your actual subscription key
const TRANS_LOCATION = "ukwest";
const TRANS_ENDPOINT = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";

// Constants for Azure Content Moderator
const MOD_KEY = "AO8T7JujE2fEz8QOlkpGE0rG1g0QufNWIT6AFiLQ8KXYYKEihqmeJQQJ99AKACmepeSXJ3w3AAAHACOG5iLW"
const MOD_ENDPOINT = "https://cs-rq.cognitiveservices.azure.com/";

// Error handling for fetch responses
async function handleFetchError(response) {
    if (!response.ok) {
        const message = `An error occurred: ${response.statusText}`;
        throw new Error(message);
    }
    return response.json();
}

// Function to translate text using Azure Translator API
async function translateText(text, toLang) {
    const url = `${TRANS_ENDPOINT}&to=${toLang}`;

    const options = {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': TRANS_KEY,
            'Ocp-Apim-Subscription-Region': TRANS_LOCATION,
            'Content-type': 'application/json'
        },
        body: JSON.stringify([{ 'text': text }])
    };

    try {
        const response = await fetch(url, options);
        const data = await handleFetchError(response);
        return data[0].translations[0].text;
    } catch (error) {
        console.error('Error translating text:', error);
        return text;  // Return the original text if translation fails
    }
}

// Function to moderate text using Azure Content Moderator API
async function moderateText(text) {
    const url = `${MOD_ENDPOINT}Text/Screen?language=eng`;

    const options = {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': MOD_KEY,
            'Content-type': 'text/plain'
        },
        body: text
    };

    try {
        const response = await fetch(url, options);
        const data = await handleFetchError(response);

        // Check for moderation terms
        if (data.Terms) {
            return { safe: false, terms: data.Terms };
        } else {
            return { safe: true };
        }
    } catch (error) {
        console.error('Error moderating content:', error);
        return { safe: true };  // Assume content is safe if moderation fails
    }
}

// Ensure your jQuery DOM Ready wrapper to avoid executing before the DOM is loaded
$(document).ready(function () {
    // Handler for the new asset submission button
    $("#subNewForm").click(function () {
        // Execute the submit new asset function
        submitNewAsset();
    });

    // Handler for the search button
    $("#searchButton").click(function () {
        // Run the search function
        searchImages();
    });

    // Handler for language dropdown change
    $('#languageDropdown').change(function () {
        // Refresh the image list with the new language
        getImages();
    });

    $('#retImages').click(function () {
        // Refresh the image list
        getImages();
    });

    // Load images on page load
    getImages();
});

// Function to fetch images and handle translations
async function getImages() {
    $('#ImageList').html('<div class="spinner-border" role="status"><span class="sr-only"> &nbsp;</span>');

    try {
        const response = await fetch(RAI);
        const data = await handleFetchError(response);

        const items = [];
        for (const val of data) {
            const translatedDescription = await translateText(val["description"], $('#languageDropdown').val() || 'en');

            items.push("<hr />");
            items.push("Image ID: " + val["id"] + "<br />");
            items.push("<img src='" + BLOB_ACCOUNT + val["filePath"] + "' width='200'/> <br />");
            items.push("Filename: " + val["fileName"] + "<br />");
            items.push("Uploaded by: " + val["userName"] + " (user ID: " + val["userID"] + ")<br />");
            items.push("Description: " + translatedDescription + "<br />");
            items.push('<button type="button" id="subNewForm" class="btn btn-danger" onclick="deleteAsset(\'' + val["id"] + '\')">Delete</button><br><br>');
            items.push("<hr />");
        }

        $('#ImageList').empty();
        $('<ul/>', {
            "class": "my-new-list",
            html: items.join("")
        }).appendTo("#ImageList");
    } catch (error) {
        console.error('Error fetching images:', error);
        $('#ImageList').html('<p class="text-danger">Failed to load images</p>');
    }
}

function searchImages() {
    var imageId = $('#searchInput').val();
    if (imageId) {
        $.getJSON(RIIURI0 + imageId + RIIURI1, function (data) {
            var items = [];
            items.push("<hr />");
            items.push("Image ID: " + data["id"] + "<br />");
            items.push("<img src='" + BLOB_ACCOUNT + data["filePath"] + "' width='200'/> <br />");
            items.push("Filename: " + data["fileName"] + "<br />");
            items.push("Uploaded by: " + data["userName"] + " (user ID: " + data["userID"] + ")<br />");
            items.push("Description: " + data["description"] + "<br />");
            items.push('<button type="button" id="subNewForm" class="btn btn-danger" onclick="deleteAsset(\'' + data["id"] + '\')">Delete</button><br><br>');
            items.push("<hr />");

            $('#ImageList').empty();
            $("<ul/>", {
                "class": "my-new-list",
                html: items.join("")
            }).appendTo("#ImageList");
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Error retrieving image:', textStatus, errorThrown);
        });
    } else {
        getImages(); // Display all images if no specific ID is given
    }
}

//A function to submit a new asset to the REST endpoint 
async function submitNewAsset() {
    const description = $('#Description').val(); // Get the description from the form
    const moderationResult =  await moderateText(description); // Check the description for moderation terms

    if (!moderationResult.safe) {
        alert('The description contains inappropriate content. Please update it before submitting.');
        return; // Exit the function if the description is not safe
    }

    const submitData = new FormData();

    //Construct JSON Object for new item
    submitData.append("Filename", $('#FileName').val());
    submitData.append("userID", $('#userID').val());
    submitData.append("userName", $('#userName').val());
    submitData.append("file", $('#UpFile')[0].files[0]);
    submitData.append("description", description);

    //Submit the new asset to the REST endpoint
    try {
        const response = await fetch(IUPS, {
            method: 'POST',
            body: submitData
        });
        const data = await handleFetchError(response); // Handle the response
        console.log(data); // Log the response data
        $('#assetForm')[0].reset(); // Use the native reset method on the form element
        getImages(); // Refresh the image list
    } catch (error) {
        console.error('Error submitting new asset:', error); // Log any errors
    }
}

function deleteAsset(id) {
    $.ajax({
        type: 'DELETE',
        url: DIAURI0 + id + DIAURI1,
    }).done(function (msg) {
        getImages();
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Error deleting asset:', textStatus, errorThrown);
    });
}

function updateAsset(id){
    $.ajax({
        type: 'PUT',
        url: UIAURI0 + id + UIAURI1,
    }).done(function (msg) {
        getImages();
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Error updating asset:', textStatus, errorThrown);
    });
}

