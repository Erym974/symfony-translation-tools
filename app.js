let default_locale = "en";
let locales = [];

$("#new-locale").on('submit', function(event) {
    event.preventDefault();
    let locale = $(event.target).serializeArray()[0].value;
    $(event.target).find('input')[0].value = ""
    addLocale(locale);
})

$(document).ready(function() {
    // Ajout d'une ligne
    $("[data-add-row]").on('click', function(event) {
        addRow()
    })

    // Modification de la langue par défaut
    $("[data-default-locale]").on('input', function(event) {
        let locale = $(event.target).val();
        setDefaultLocal(locale)
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

function suggeredLocale(locale) {
    $("#new-locale").find('input')[0].value = locale
}

function setDefaultLocal(locale){
    $(`[data-locale="${default_locale}"]`).each(function() {
        $(this).attr('data-locale', locale);
        if($(this).attr('scope') == 'col') {
            $(this).text(`${locale} (default)`);
        }
    })
    default_locale = locale;
}

function resetWebsite(){

    locales.forEach((locale, index) => {
        deleteLocale(locale, true);

        if(index == locales.length - 1) {
            locales = [];
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
    $("[data-default-locale]").val("en");
}

// Quand on modifie une clef de la langue par défaut
function onDefaultKeyInput(parent) {
    let key = $(parent).val();

    const result = $(`input[data-locale="${default_locale}"]`).filter((index, input) => { return $(input).val() == key && input != parent && key != ""});

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
function addLocale(locale){

    if(locales.indexOf(locale) > -1) return;

    locales.push(locale);

    $("#table-header").append(`<th scop="col" data-locale="${locale}">
        <div class="d-flex aic jcc gap-5">
            <span data-editable-col="${locale}">${locale}</span>
            <div class="d-flex gap-1 aic">
                <span class="material-icons-sharp pointer" onclick="editLocale('${locale}')">edit</span>
                <span class="material-icons-sharp pointer text-danger" onclick="deleteLocale('${locale}')">delete</span>
            </div>
        </div>
    </th>`);
    $(".table-tr").each(function(index) {
        $(this).append(`<td><input type="text" class="form-control" data-row="${index + 1}" data-locale="${locale}"></td>`);
    });

    $(`[data-editable-col="${locale}"]`).on('keydown', function(event) {
        if(event.keyCode == 32) {
            event.preventDefault();
        }

        if(event.keyCode == 13){
            event.preventDefault();

            let new_locale = $(this).text();
            $(this).attr('contenteditable', 'false');
            $(`[data-locale="${locale}"]`).each(function() {
                $(this).attr('data-locale', new_locale);
            })

            $(this).blur();
        }
    })

}

function addRow(){
    let count = $("tbody").children().length;

    let html = `<tr class="table-tr">`
        html += `<td>
            <input type="text" onblur="onDefaultKeyInput(this)" onkeyup="onDefaultKeyInput(this)" data-row="${count}" data-locale="${default_locale}" class="form-control" aria-describedby="row-${count}-default">
            <div id="row-${count}-default" class="invalid-feedback">
                This key is already register.
            </div>
        </td>`;
        locales.forEach((locale, index) => {
            html += `<td>
                <input type="text" class="form-control" data-row="${count}" data-locale="${locale}">
            </td>`;
        });
        html += `</tr>`;    
    $(html).insertBefore("[data-button-parent]");
}

function editLocale(locale) {

    $(`[data-editable-col="${locale}"]`).attr('contenteditable', 'true');
    
    $(`[data-editable-col="${locale}"]`).on('blur', function(event) {
        let new_locale = $(this).text();
        $(this).attr('contenteditable', 'false');

        $(`[data-locale="${locale}"]`).each(function() {
            $(this).attr('data-locale', new_locale);
        })
    })

}

function deleteLocale(locale, keep = false) {

    $(`th[data-locale="${locale}"]`).remove()

    $(`input[data-locale="${locale}"]`).each(function() {
        $(this).parent(0).remove();
    })
    if(!keep){
        locales.splice(locales.indexOf(locale), 1);
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
        if(!parsedKey) return alert("Some languages dosn't have a key");
        let content = "";
        Object.entries(value).forEach(([locale, value]) => {
            content += `${locale}: ${value} \n`;
        })
        downloadFile(`messages.${key}.yaml`, content);
    })
    
}

function extractData(){

    let json = {};

    let cp_locales = [default_locale];
    cp_locales = cp_locales.concat(locales);

    cp_locales.forEach((locale) => {

        json[locale] = {};
        $(`input[data-locale="${locale}"]`).each(function() {
            let key = $(`input[data-locale="${default_locale}"][data-row="${$(this).attr('data-row')}"]`).val();
            let value = $(this).val();

            json[locale][key] = value;
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

    Object.entries(fixtures).forEach(([locale, value]) => {

        if(locale != default_locale){
            addLocale(locale);
        };

        for (let index = 1; index <= Object.entries(value).length; index++) {
            $(`input[data-locale="${locale}"][data-row="${index}"]`).val(Object.values(value)[index - 1]);
        }

    })

}