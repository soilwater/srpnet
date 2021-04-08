// SRPNet App
var model;
var predResult = document.getElementById("result");
async function initialize() {
    model = await tf.loadLayersModel('https://raw.githubusercontent.com/soilwater/srpnet/main/models/tensoflowJSmodel/model.json');
}

initialize();


(function() {
    document.getElementById("result_values").style.display= "none";
    document.getElementById("download_original_image").style.display= "none";
    document.getElementById("download_predicted_image").style.display= "none";
 })();


function modalInfo(){
    const elem = document.getElementById('modal_info');
    const instance = M.Modal.init(elem, {dismissible: false});
    instance.open();
}

function modalAbout(){
    const elem = document.getElementById('modal_about');
    const instance = M.Modal.init(elem, {dismissible: false});
    instance.open();
}

 async function uploadImage(input) {

    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload =  function(e) {
            document.getElementById("previewHolder").setAttribute("src",e.target.result);
            // Try to get 
            var original_image_tag = document.getElementById('download_original_image');
            original_image_tag.href = e.target.result; 
        }

        // Triggers the onload 
        reader.readAsDataURL(input.files[0]);
        // triger the predict function after the image loaded
        reader.onloadend = () => predict(); 
    } else {
        alert('select a file to see preview');
        document.getElementById("previewHolder").setAttribute("src",'');
    }
}


async function predict() {
   
    removePreviousResult();
    const tensorImg = await tf.tidy(() => {
        let image_from_element = document.getElementById("previewHolder");
        let tensorImg = tf.browser.fromPixels(image_from_element).toFloat().expandDims();
        return tensorImg;
    });

    prediction = await model.predict(tensorImg);
    tf.dispose(tensorImg);
    var results = await prediction.argMax(3).dataSync();
    tf.dispose(prediction);

    // create an offscreen canvas
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
   
    // size the canvas to your desired image
    canvas.width = 512;
    canvas.height = 512;
   
    // get the imageData and pixel array from the canvas
    var imgData = ctx.getImageData(0, 0, 512, 512);
    var data = imgData.data;
  
    index = 0;
    counter = 0;
    for(let y=0; y < canvas.height; y++){
        for(let x=0; x < canvas.height; x++){
            let index = (x + y * canvas.width)*4;
        
            pixel_value = results[counter];
            // stubble 
            if (pixel_value == 0){
                data[index+0] = 255;
                data[index+1] = 255;
                data[index+2] = 0;
                data[index+3] = 255;

            }else if(pixel_value == 1){
                // soil brown
                data[index+0] = 165;
                data[index+1] = 42;
                data[index+2] = 42;
                data[index+3] = 255;

            }else {
                //live vegetation green
                data[index+0] = 0;
                data[index+1] = 255;
                data[index+2] = 0;
                data[index+3] = 255;
            }
            counter += 1; 
        }
    }

    // unique groups available in picture
    var unique_items = unique(results) 
  

    /* console.log("unit",unique_items); */


    var counts = {};
    for (var i = 0; i < results.length; i++) {
        counts[results[i]] = 1 + (counts[results[i]] || 0);
    }

    var sum_count = 0;
    var per_stubble = 0;
    var per_soil = 0;
    var per_canopy = 0;
   /*  console.log("counts array",counts); */

    // stubble 
    if(counts.hasOwnProperty(0)){
        sum_count = sum_count + counts[0]; 
        per_stubble =  counts[0]; 
       /*  console.log("1 is here"); */
    }

    // soil 
    if(counts.hasOwnProperty(1)){
        /* console.log("2 is here"); */
        per_soil = counts[1];
        sum_count = sum_count + counts[1]; 
    }

    // Canopy
    if(counts.hasOwnProperty(2)){
        /* console.log("3 is here"); */
        per_canopy = counts[2];
        sum_count = sum_count + counts[2]; 
    }

    /* console.log("per_stubble",per_canopy); */
    per_stubble = (per_stubble/sum_count)*100;
    per_canopy  = (per_canopy/sum_count)*100;
    per_soil = (per_soil/sum_count)*100;

    document.getElementById('stubble_label').textContent = per_stubble.toFixed(2);
    document.getElementById('soil_label').textContent = per_soil.toFixed(2);
    document.getElementById('canopy_label').textContent = per_canopy.toFixed(2);

    tf.dispose(results);
    // put the modified pixels back on the canvas
    ctx.putImageData(imgData, 0, 0);

    // create a new img object
    var image = new Image();
    
    image.id = "result_image";
    // Attached canvas information to image tag
    image.src = canvas.toDataURL();  

    // append the new img object to the page
    //document.body.appendChild(image);
    document.getElementById('result_div').append(image);


    // Try to get 
    var a = document.getElementById('download_predicted_image');
    a.href = image.src;  

    // View the original image holder
    document.getElementById("previewHolder").style.display = "block";
    
    // Show calculated values of canopy cover values
    document.getElementById("result_values").style.display= "block";

    document.getElementById("result_div").style.display= "table";
    // Downloadable button for preview image and generated image
    document.getElementById("download_original_image").style.display= "block";
    document.getElementById("download_predicted_image").style.display= "table-footer-group";
}

function removePreviousResult(){
    var result_elm = document.getElementById("result_image");

    //If it isn't "undefined" and it isn't "null", then it exists.
    if(typeof(result_elm) != 'undefined' && result_elm != null){
        result_elm.remove();
       /*  console.log("result removed"); */
    } else{
        /* console.log('Element does not exist!'); */
       // result_elm.remove();
    }
}

function unique(arr) {
    var hash = {}, result = [];
    for ( var i = 0, l = arr.length; i < l; ++i ) {
        if ( !hash.hasOwnProperty(arr[i]) ) { //it works with objects! in FF, at least
            hash[ arr[i] ] = true;
            result.push(arr[i]);
        }
    }
    return result;
}


