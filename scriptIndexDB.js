if (!('indexedDB' in window)) {
    alert('This browser doesn\'t support IndexedDB');
}

var request = window.indexedDB.open("myDatabase", 1);   // open database
request.onupgradeneeded = function(event) {
    var db = event.target.result,
        store = db.createObjectStore("Templates", { keyPath: "id",autoIncrement: true }),  // create object "Templates"
        index = store.createIndex("name", "name", {unique: true}),
     	store2 = db.createObjectStore("Formulars", { keyPath: "id",autoIncrement: true }), // create object "Formulars"
		index2 = store2.createIndex("fname", "fname", {unique: true});
			
    store.add({name: "Some existing formular",             
               template:[{formularName: "Some existing formular"},
                         {labName: "Label1", inputType: 'Textbox', radBtn: null, isReqInput: 'Mandatory'},
                         {labName: "Label2", inputType: 'Textbox', radBtn: null, isReqInput: 'None'},
                         {labName: "Label3", inputType: 'Checkbox', radBtn: null, isReqInput: 'None'},
                         {labName: "Label4", inputType: 'Textbox', radBtn: null, isReqInput: 'Numeric'},
                         {labName: "Label5", inputType: 'Radio buttons', radBtn: ['Radio Button 1','Radio Button 2','Radio Button 3'], isReqInput: 'Mandatory'},
                         {labName: "Label6", inputType: 'Textbox', radBtn: null, isReqInput: 'None'}
                        ]});		 // store first template
};
request.onerror = function(event) {
	console.log("Can\'t open database");
};
request.onsuccess = function(event) {
	var db = request.result;
		tx = db.transaction("Templates", "readwrite"),
		store = tx.objectStore("Templates");
	var sel = document.getElementById('choseFormular');	
	store.openCursor().onsuccess = function(event) {
		var cursor = event.target.result;
		if( cursor ) {
			if( cursor.value.name != "Some existing formular" ) {
				var option = document.createElement("option");
				option.text = cursor.value.name;
				option.value = cursor.value.name;
				sel.add(option);                 // here we put all formulars names in select (id='choseFormular')
			}
			cursor.continue();
		} 
	};
		
	tx.oncomplete = function(event){
		db.close();
	};
};

// This function put or get forumulars in datebase
function myDatabase(storeName,fName,formular,fVer = 0) { 
    var request = window.indexedDB.open("myDatabase", 1);
      
    request.onerror = function(event) {
        console.log("Can\'t open database");
    };
   
    if( storeName == "Templates" ){
        var myIndex = "name";
    }
    else {
        var myIndex = "fname";
    }
    request.onsuccess = function(event) {
        var db = request.result;
            tx = db.transaction(storeName, "readwrite"),
            store = tx.objectStore(storeName),
            index = store.index(myIndex);
           
        db.onerror = function(event) {
            console.log("Error : " + event.target.errorCode);
        };
       
        if( formular == null) { // means that we are searching for 'fName' formaular
            var x = index.get(fName);
            x.onsuccess = function() {
                if( storeName == "Templates"){ // if we searching for template
                    if(  x.result != undefined ) { // when we found template we display it (in Formular tab we make form)
						if( fVer == null ){
						formTemplate(x.result.template);
						}
						else {
							displaysFormularTemplate(x.result.template);
						}
					}
					else {
						makeFormularTemplate(fName);
					}	
                }
                else {  // if we searching for formular version
                    if( x.result != undefined) {
						var versions = x.result.version;
						if( fVer <= versions.length ) { // when we found that version we display it
							displaysFormularVersion(versions[fVer - 1]);
						}   
                    }
				}
            };
        }
        else {  // here we store data in objectStore Templates and Formulars
            var x = index.get(fName);
			x.onsuccess = function(event) {
                if( x.result != undefined ) {  // if formular allready exist in DB that means: upload 
					index.openCursor().onsuccess = function(event) { 
						var cursor = event.target.result;
						if(cursor) {
							if( cursor.value.name == fName || cursor.value.fname == fName) {
								var updateData = cursor.value;
								if( storeName == "Templates" ){
									updateData.template =  formular;  // update template
									alert("Uploaded!");
								}
								else {
									var newVersion = updateData.version;
									if( fVer <= newVersion.length){
										newVersion[fVer - 1] = formular;   // update version of formular
										alert("Uploaded!");
									}
									else {		
										newVersion.push(formular);  // save new version 
										 alert("Saved!");
									}
									updateData.version = newVersion;
								}
								cursor.update(updateData);
							}
							cursor.continue(); 
						}
					};
				}
				else {
					if( storeName == "Templates" ) { 
						store.add({ name: fName, template: formular});
						addFormularName(fName);
					}
					else {
						store.add({ fname: fName, version: [ formular ]});
					}
                    alert("Saved!");
                }
			}   
        }
       
        tx.oncomplete = function(event){
            db.close();
        };
       
    };
}

// This function open corresponding tab	
function openPage(pageName, elmnt) {
    document.getElementById("welcomePage").style.display = "none";
    var i, tabcontent, tablinks;
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    //Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";
    // Add the specific color to the button used to open the tab content
    elmnt.style.backgroundColor = "white";
}
         
/*----------------------------------------------------------------------------------------------------- */
/*       Functions for first tab      */
/*----------------------------------------------------------------------------------------------------- */
                 
var elementNum = 1, btnId = 0; // elementNum is the order number of Element, and btnId is for setting add button
 
function searchFormular(fName){
    var el = document.getElementById('Administration').getElementsByTagName('div');
    var max = el.length;
    for (var i = 0; i <= max; i++ ){
        var last = document.getElementById('Administration').lastChild;
        document.getElementById('Administration').removeChild(last);      // clean tab Administration
    }
	
    myDatabase("Templates",fName,null);
}
 
// This function displays existing formular
function displaysFormularTemplate(template){
    btnId = 0;
    elementNum = 1;
   
    var saveBtn = document.createElement('button');
    saveBtn.setAttribute("id",'saveButton');
    saveBtn.setAttribute("onclick",'saveFormularTemplate(this)');
    saveBtn.innerHTML = "Save";
    document.getElementById('Administration').appendChild(saveBtn);
   
    for (var i = 1; i < template.length; i++ ){
        var el = addElement();
        var input = el.getElementsByTagName('input')[0];
        input.value = template[i].labName;
        var s1 = el.getElementsByClassName('firstSelect')[0];
        s1.value = template[i].inputType;
        el.getElementsByClassName('secondSelect')[0].value = template[i].isReqInput;
       
        var s = el.getElementsByClassName('additionalSelect')[0];
        if ( template[i].inputType != "Radio buttons" ){
            s.style.display = "none";
        }
        else {
            s.style.display = "inline";
            s.value = template[i].radBtn.length;
            onChange(s);
            var inputs = el.getElementsByTagName('p');
            for ( var k = 0; k < inputs.length; k++){
                inputs[k].getElementsByTagName('input')[0].value = template[i].radBtn[k];
            }
        }
    }
}
 
 // This function make a template for new formular  
function makeFormularTemplate(fName){
    elementNum = 1;
    btnId = 0;
   
    var saveBtn = document.createElement('button');
    saveBtn.setAttribute("id",'saveButton');
    saveBtn.setAttribute("onclick",'saveFormularTemplate(this)');
    saveBtn.innerHTML = "Save";
    document.getElementById('Administration').appendChild(saveBtn);
   
    addElement();
}
 
// Adds an element to the document
function addElement() {
    var div = document.createElement('div');
    var tab = document.getElementById('Administration');
    div.innerHTML = "Element " + elementNum + ": ";
    tab.insertBefore(div,tab.lastChild);
   
    var input = document.createElement('input');
    input.value = "";
    div.appendChild(input);
   
    var slc1 = addSelect(div,'firstSelect',['Textbox','Checkbox','Radio buttons']);
    slc1.setAttribute("onchange",'onChange(this)');
    var adSlc = addSelect(div,'additionalSelect',['',2,3,4,5,6]);
    adSlc.setAttribute("onchange",'onChange(this)');
    adSlc.style.display = "none";
    var slc2 = addSelect(div,'secondSelect',['Mandatory','None','Numeric']);
   
    var butn = document.createElement('button');
    butn.innerHTML = "  +  ";
    if ( btnId != 0 ){
        document.getElementById(btnId).style.visibility = "hidden";
    }
    btnId = "btnId" + elementNum;
    butn.setAttribute("id",btnId);
    butn.setAttribute("onclick",'addElement()');
    butn.setAttribute("style",'border-radius: 80px');
   
    div.appendChild(butn);
    elementNum += 1;
    return div;
}
 
// This function create select element
function addSelect(parent,id,options){
    var select = document.createElement('select');
    for ( var j = 0; j < options.length; j++){
        var opt = document.createElement('option');
        opt.value = options[j];
        opt.innerHTML = options[j];
        select.appendChild(opt);
    }
    select.setAttribute("class",id);
    parent.appendChild(select);
    return select;
}      
   
// This function show/hide third select
//  and it adds corresponding number of inputs
function onChange(temp){  
    if (  temp.className == "firstSelect"  ){
        if ( temp.selectedIndex == 2 ){                         // show additionalSelect
            temp.nextElementSibling.style.display = "inline";
            temp.nextElementSibling.selectedIndex = 0
            temp = temp.nextElementSibling;
         }
        else {                                                  // hide additionalSelect and inputs
            temp.nextElementSibling.style.display = "none";  
            var max = temp.parentNode.getElementsByTagName('p').length;
            for (var k = 0; k < max; k++){
                 var last = temp.parentNode.lastChild;
                 temp.parentNode.removeChild(last);
            }
        }
    }
         
    if ( temp.className == "additionalSelect"){            // add corresponding number of inputs
        var num = temp.selectedIndex + 1;
        var div = temp.parentNode;
        var numbOfInputs = div.getElementsByTagName("p").length;
        if ( num != 1 ){
                                                        // if current number of inputs is bigger than previous
            if ( num > numbOfInputs ){                  // add remainder inputs
                for (var k = numbOfInputs; k < num; k++){
                    var p = document.createElement('p');
               
                    p.setAttribute("value",'');
                    var input = document.createElement('input');
                    p.appendChild(input);
                    div.appendChild(p);
                }
               
            }                                           // if previous number of inputs is bigger than current
            else {                                      // remove remainder inputs
                for (var k = num; k < numbOfInputs; k++){
                    var last = div.lastChild;
                    div.removeChild(last);
                } 
            }
        }
		else {                                          // if we select one input, than remove all inputs
            for (var k = 0; k < numbOfInputs; k++){
                var last = div.lastChild;
                div.removeChild(last);
            }
        }
    }
}
 
// this function create array formular, where we store all inputs of client
function createFormularTemplate(saveBtn){
    var newLabel;
    var fName = document.getElementById('formularName').value;
    var parent = saveBtn.parentNode;
    var labels = parent.getElementsByTagName('div');
    var formular = [ { formularName: fName} ];
    for (var i=0; i < labels.length ; i++){
        var name = labels[i].getElementsByTagName('input')[0].value;    // name of label
        var s = labels[i].getElementsByTagName('select');      
        var type = s[0].value;                                          // input type of label
        if ( type == 'Radio buttons'){
            var rBtn = [];                                              // additional inputs for radio buttons
            nameRBtn = labels[i].getElementsByTagName('p');
            for (var j = 0; j < nameRBtn.length; j++){
                rBtn.push(nameRBtn[j].getElementsByTagName('input')[0].value);
            }
        }
        else {
            var rBtn = null ;
        }
        var req = s[s.length-1].value;                                  // required input
        newLabel = { labName: name, inputType: type, radBtn: rBtn, isReqInput: req};
        formular.push(newLabel);
    }
    return formular;
}
 
function saveFormularTemplate(saveBtn){
    var formular = createFormularTemplate(saveBtn);
    var fName = document.getElementById('formularName').value;
    myDatabase("Templates",fName,formular);       // store formular 
}
 
/*----------------------------------------------------------------------------------------------------- */
/*                      Functions for second tab                                                        */
/*----------------------------------------------------------------------------------------------------- */
 
// This function add formular name in chose field
function addFormularName(fName){
    var sel = document.getElementById('choseFormular');
    var option = document.createElement("option");
    option.text = fName;
    option.value = fName;
    sel.add(option);
}
 
function loadFormular(fName,ver){
    var last = document.getElementById('Formular').lastChild;
    document.getElementById('Formular').removeChild(last);      // clean tab
    myDatabase("Templates",fName,null,null);  // searching for template
    myDatabase("Formulars",fName,null,ver);   // searching for formulars vesrion
}
 
// This function create template for chosen formular
function formTemplate(template){
    var f = document.createElement('form');
    f.setAttribute("id",'makeForm');
    f.setAttribute("action",'JavaScript:saveFormularVersion(this)');
    document.getElementById('Formular').appendChild(f);
   
    for (var i = 1; i < template.length; i++){
        makeLabel(template[i],i);  
    }
   
    var btn = document.createElement('input');
    btn.setAttribute("type",'submit');
    btn.setAttribute("value",'Save');
    btn.setAttribute("id",'save');
    f.appendChild(btn);
}
 
// This function displays chosen version of formular
function displaysFormularVersion(fVersion){
    var input;
    var form = document.getElementById('makeForm');
    for( var j = 0; j < (form.elements.length - 1); j++){
        input = fVersion[j];
        if( input == "checked"){
            form.elements[j].setAttribute("checked","");
        }
        else {
            form.elements[j].value = input;
        }
    }
}
 
// This function create one row in the template
function makeLabel(element,x){
    var place = document.getElementById('makeForm');
    var div = document.createElement('div');
    div.setAttribute("class",'row');
    place.appendChild(div);
   
    var lab1 = document.createElement('div');
    div.appendChild(lab1);
    var span = document.createElement('p');
    lab1.appendChild(span);
    span.innerHTML = element.labName + " :";
   
    var lab2 = document.createElement('div');
    div.appendChild(lab2);
    var input = document.createElement('input');
    if( element.radBtn == null){
        lab2.appendChild(input);
        input.setAttribute("type",element.inputType);
        if( element.isReqInput == "Numeric" ){
            input.setAttribute("type",'number');
            //input.setAttribute("min",'1');
            input.setAttribute("placeholder",'Numeric input');
        }
    }
    else {
        for (var k = 0; k < element.radBtn.length; k++ ){
            var p = document.createElement('p');
            lab2.appendChild(p);
            var inputs = document.createElement('input');
            inputs.setAttribute("type",'radio');
            inputs.setAttribute("name",'radio'+x);
            p.appendChild(inputs);
            var s = document.createElement('span');
            s.innerHTML = element.radBtn[k];
            p.appendChild(s);
        }
    }
    if( element.isReqInput == "Mandatory"){
        input.setAttribute("required","");
        span.innerHTML = element.labName + "* :";
    }
}
 
// This function store users inputs for specific version
function saveFormularVersion(form){
    var formular = [], f = document.getElementById('makeForm');
    for( var i = 0; i < (f.elements.length -1); i++){
        var input;
        if (  f.elements[i].checked ){
            input = "checked";
        }
        else {
            input = f.elements[i].value;
        }
        formular.push(input);
    }
    var fVer = document.getElementById('formularVersion').value;
    var fName = document.getElementById('choseFormular').value;
    myDatabase("Formulars",fName,formular,fVer);
}