let default_language = "en";
let languages = [];

$("#new-language").on('submit', function(event) {
    event.preventDefault();
    let language = $(event.target).serializeArray()[0].value;
    $(event.target).find('input')[0].value = ""
    addLanguage(language);
})

$(document).ready(function() {
    // Ajout d'une ligne
    $("[data-add-row]").on('click', function(event) {
        addRow()
    })

    // Modification de la langue par défaut
    $("[data-default-language]").on('input', function(event) {
        let language = $(event.target).val();
        setDefaultLocal(language)
    })

    $("#import-data").on('submit', function(event) {
        event.preventDefault();

        let file = $("#imported-data")[0].files[0];

        let reader = new FileReader();

        reader.onload = function(event){
            let datas = JSON.parse(event.target.result);
            initFixture(datas);
        };

        reader.readAsText(file);

    })

    // initFixture()

});

function suggeredLanguage(language) {
    $("#new-language").find('input')[0].value = language
}

function setDefaultLocal(language){
    $(`[data-language="${default_language}"]`).each(function() {
        $(this).attr('data-language', language);
        if($(this).attr('scope') == 'col') {
            $(this).text(`${language} (default)`);
        }
    })
    default_language = language;
}

function resetWebsite(){

    languages.forEach((language, index) => {
        deleteLanguage(language, true);

        if(index == languages.length - 1) {
            languages = [];
        }
    })

    $(".table-tr").each(function(index) {
        if(index != 0) {
            $(this).remove();
            
        } else {
            $(this).children().each(function() {
                $(this).children().first().val("");
            })
        }
    })

    setDefaultLocal("en");
    $("[data-default-language]").val("en");
}

// Quand on modifie une clef de la langue par défaut
function onDefaultKeyInput(parent) {
    let key = $(parent).val();

    const result = $(`input[data-language="${default_language}"]`).filter((index, input) => { return $(input).val() == key && input != parent && key != ""});

    if(result.length >= 1){
        $(parent).addClass('is-invalid');
        $(parent).parent().find('.invalid-feedback').show();
    } else {
        if($(parent).hasClass('is-invalid')) {
            $(parent).removeClass('is-invalid');
            $(parent).parent().find('.invalid-feedback').hide();
        }
    }
}

// Quand on rajoute une langue
function addLanguage(language){

    if(languages.indexOf(language) > -1) return;

    languages.push(language);

    $("#table-header").append(`<th scop="col" data-language="${language}">
        <div class="d-flex aic jcc gap-5">
            <span data-editable-col="${language}">${language}</span>
            <div class="d-flex gap-1 aic">
                <span class="material-icons-sharp pointer" onclick="editLanguage('${language}')">edit</span>
                <span class="material-icons-sharp pointer text-danger" onclick="deleteLanguage('${language}')">delete</span>
            </div>
        </div>
    </th>`);
    $(".table-tr").each(function(index) {
        $(this).append(`<td><input type="text" class="form-control" data-row="${index + 1}" data-language="${language}"></td>`);
    });

    $(`[data-editable-col="${language}"]`).on('keydown', function(event) {
        if(event.keyCode == 32) {
            event.preventDefault();
        }

        if(event.keyCode == 13){
            event.preventDefault();

            let new_language = $(this).text();
            $(this).attr('contenteditable', 'false');
            $(`[data-language="${language}"]`).each(function() {
                $(this).attr('data-language', new_language);
            })

            $(this).blur();
        }
    })

}

function addRow(){
    let count = $("tbody").children().length;

    let html = `<tr class="table-tr"><td class="text-center"><button class="btn btn-danger" onclick="deleteRow(this)">Delete row</button></td>`
        html += `<td>
            <input type="text" onblur="onDefaultKeyInput(this)" onkeyup="onDefaultKeyInput(this)" data-row="${count}" data-language="${default_language}" class="form-control" aria-describedby="row-${count}-default">
            <div id="row-${count}-default" class="invalid-feedback">
                This key is already register.
            </div>
        </td>`;
        languages.forEach((language, index) => {
            html += `<td>
                <input type="text" class="form-control" data-row="${count}" data-language="${language}">
            </td>`;
        });
        html += `</tr>`;    
    $(html).insertBefore("[data-button-parent]");
}

function deleteRow(e) {
    $(e).closest('tr.table-tr').remove();
}

function editLanguage(language) {

    $(`[data-editable-col="${language}"]`).attr('contenteditable', 'true');
    
    $(`[data-editable-col="${language}"]`).on('blur', function(event) {
        let new_language = $(this).text();
        $(this).attr('contenteditable', 'false');

        $(`[data-language="${language}"]`).each(function() {
            $(this).attr('data-language', new_language);
        })
    })

}

function deleteLanguage(language, keep = false) {

    $(`th[data-language="${language}"]`).remove()

    $(`input[data-language="${language}"]`).each(function() {
        $(this).parent(0).remove();
    })
    if(!keep){
        languages.splice(languages.indexOf(language), 1);
    }
}

function exportData(){

    let datas = extractData();
    downloadFile("extracted-data.json", JSON.stringify(datas))

}

function download(){
    let json = extractData();

    Object.entries(json).forEach(([key, value]) => {
        const parsedKey = key.trim().replace(' ', '_');
        if(!parsedKey) return alert("Some languages have no key");
        let content = "";
        Object.entries(value).forEach(([language, value]) => {
            content += `${language}: ${value} \n`;
        })
        downloadFile(`messages.${key}.yaml`, content);
    })
    
}

function extractData(){

    let json = {};

    let cp_languages = [default_language];
    cp_languages = cp_languages.concat(languages);

    cp_languages.forEach((language) => {

        json[language] = {};
        $(`input[data-language="${language}"]`).each(function() {
            let key = $(`input[data-language="${default_language}"][data-row="${$(this).attr('data-row')}"]`).val();
            let value = $(this).val();

            json[language][key] = value;
        })

    })

    return json;

}

function downloadFile(fileName, fileContent){

    $("body").append(`<a id="download-btn" class="d-none" target="_blank" download="${fileName}" href="data:text/plain;charset=utf-8,${encodeURIComponent(fileContent)}"></a>`);

    console.log($(`#download-btn`));

    $("#download-btn").get(0).click();
    $("#download-btn").remove()

}

function initFixture(fixtures){

    resetWebsite()

    fixtures = fixtures ?? {
        "en": {
            "Hello":"Hello",
            "World":"World",
            "Car":"Car",
            "Game":"Game"
        },
        "fr":{
            "Hello":"Bonjour",
            "World":"Monde",
            "Car":"Voiture",
            "Game":"Jeux"
        },
        "es": {
            "Hello":"Hola",
            "World":"Mundo",
            "Car":"Coche",
            "Game":"Juegos"
        },
        "al": {
            "Hello":"Hallo",
            "World":"Welt",
            "Car":"Auto",
            "Game":"Spiel"
        }
    };

    for (let index = 1; index <= Object.entries(fixtures).length - 1; index++) {
        addRow();
    }

    Object.entries(fixtures).forEach(([language, value]) => {
        if(language != default_language){
            addLanguage(language);
        };
        for (let index = 1; index <= Object.entries(value).length; index++) {
            $(`input[data-language="${language}"][data-row="${index}"]`).val(Object.values(value)[index - 1]);
        }
    })

}