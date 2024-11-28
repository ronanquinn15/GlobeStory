//The URI of image upload
IUPS = "https://prod-08.uksouth.logic.azure.com:443/workflows/bfd6e8b4bf39442ab2606b99363f6711/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=8nOk2epLiyxh7PvxI1R3e1uxJb_Ib6AC8GTpNPY8UQc";

//The URI of the retrieve all images endpoint
RAI = "https://prod-00.uksouth.logic.azure.com:443/workflows/ca0d346342204e40b89a887c38ef1a4b/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=dPeWrzDmZvG2Yt6mwJP3lxFqfs7gYD-5AabI1dm_SvY";

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


//Handlers for button clicks
$(document).ready(function () {
    $("#retImages").click(function () {
        //Run the get asset list function
        getImages();
    });

    //Handler for the new asset submission button
    $("#subNewForm").click(function () {
        //Execute the submit new asset function
        submitNewAsset();
    });

    //Handler for the search button
    $("#searchButton").click(function () {
        //Run the search function
        searchImages();
    });

    //Handler for the sort dropdown change event
    document.getElementById('sortDropdown').addEventListener('change', function() {
        const sortValue = this.value;
        sortImages(sortValue);
    });

});

function sortImages(order) {
    const imageList = document.getElementById('ImageList');
    const images = Array.from(imageList.getElementsByClassName('image-item'));

    images.sort((a, b) => {
        const userIdA = a.getAttribute('data-user-id');
        const userIdB = b.getAttribute('data-user-id');

        if (order === 'asc') {
            return userIdA.localeCompare(userIdB);
        } else if (order === 'desc') {
            return userIdB.localeCompare(userIdA);
        } else {
            return 0;
        }
    });

    // Clear the current list and append sorted images
    imageList.innerHTML = '';
    images.forEach(image => imageList.appendChild(image));
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
            $('#ImageList').html('<h4>No image found with the given ID.</h4>');
        });
    } else {
        $('#ImageList').html('<h4>Please enter an Image ID to search.</h4>');
    }
}

//A function to submit a new asset to the REST endpoint 
function submitNewAsset() {
    submitData = new FormData();

    //Construct JSON Object for new item
    submitData.append("Filename", $('#FileName').val());
    submitData.append("userID", $('#userID').val());
    submitData.append("userName", $('#userName').val());
    submitData.append("file", $('#UpFile')[0].files[0]);
    submitData.append("description", $('#Description').val());

    //Post the JSON string to the endpoint, note the need to set the content type header
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
        }
    });
}

//A function to get a list of all the assets and write them to the Div with the AssetList Div
function getImages() {
    $('#ImageList').html('<div class="spinner-border" role="status"><span class="sr-only"> &nbsp;</span>');
    $.getJSON(RAI, function (data) {
        var items = [];

        $.each(data, function (key, val) {
            console.log(val);
            items.push("<hr />");
            items.push("Image ID: " + val["id"] + "<br />");
            items.push("<img src='" + BLOB_ACCOUNT + val["filePath"] + "' width='200'/> <br />");
            items.push("Filename: " + val["fileName"] + "<br />");
            items.push("Uploaded by: " + val["userName"] + " (user ID: " + val["userID"] + ")<br />");
            items.push("Description: " + val["description"] + "<br />");
            items.push('<button type="button" id="subNewForm" class="btn btn-danger" onclick="deleteAsset(\'' + val["id"] + '\')">Delete</button><br><br>');
            items.push("<hr />");
        });

        $('#ImageList').empty();

        $("<ul/>", {
            "class": "my-new-list",
            html: items.join("")
        }).appendTo("#ImageList");
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

