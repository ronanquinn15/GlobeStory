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

// Constants for Azure Content Safety
const CONTENT_SAFETY_KEY = "5TyJVH1ei7sqZM7484CZQq2YXTKDuqog93Vv6TroIohQPLIE35HvJQQJ99ALACmepeSXJ3w3AAAHACOG2BjJ"; // Replace with your actual Content Safety subscription key
const CONTENT_SAFETY_ENDPOINT = "https://cs-rq.cognitiveservices.azure.com/contentsafety/text:analyze?api-version=2023-10-01"; 

// Error handling for fetch responses
async function handleFetchError(response) {
    if (!response.ok) {
        const errorBody = await response.text();
        const message = `An error occurred: ${response.statusText} - ${errorBody}`;
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

// Function to moderate text using Azure Content Safety API
async function analyseContent(description) {
    const url = CONTENT_SAFETY_ENDPOINT;

    const options = {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': CONTENT_SAFETY_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "text": description,
            "categories": ["Hate", "SelfHarm", "Violence", "Sexual"],
            "blocklistNames": [],
            "haltOnBlocklistHit": true, 
            "outputType": "FourSeverityLevels"
        })
    };

    try {
        const response = await fetch(url, options);
        const data = await handleFetchError(response);
        
        // Log the response for debugging
        console.log('Content Safety API Response:', data);
        if (data.categoriesAnalysis && data.categoriesAnalysis.length > 0) {
            const unsafeCategories = data.categoriesAnalysis.filter(category => category.severity >= 6);
            if (unsafeCategories.length > 0) {
                return {
                    safe: false,
                    categories: unsafeCategories.map(cat => cat.category),
                    severities: unsafeCategories.map(cat => cat.severity)
                };
            }
        }
        return { 
            safe: true, 
            categories: [], 
            severities: [] 
        };
    } catch (error) {
        console.error('Error analyzing content:', error);
        return { 
            safe: true, 
            categories: ["Error"], 
            severities: ["Error"] 
        };  // Assume content is safe if analysis fails
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
        // Refresh the image list with t1he new language
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

async function submitNewAsset() {
    const description = $('#Description').val(); // Get the description from the form

    // Analyse the description before submitting
    const contentAnalysisResult = await analyseContent(description);

    if (!contentAnalysisResult.safe) {
        alert(`The description contains inappropriate content: ${contentAnalysisResult.categories.join(', ')}. Severities: ${contentAnalysisResult.severities.join(', ')}`);
        return false; // Do not submit the asset
    }

    const submitData = new FormData();
    submitData.append("Filename", $('#FileName').val());
    submitData.append("userID", $('#userID').val());
    submitData.append("userName", $('#userName').val());
    submitData.append("file", $('#UpFile')[0].files[0]);
    submitData.append("description", description);

    // Post the JSON string to the endpoint, note the need to set the content type header
    $.ajax({
        url: IUPS,
        data: submitData,
        cache: false,
        enctype: 'multipart/form-data',
        contentType: false,
        processData: false,
        type: 'POST',
        success: function (data) {
            $('#newAssetForm')[0].reset();
            getImages(); // Refresh the images list
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error submitting asset:', textStatus, errorThrown);
        }
    });
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

