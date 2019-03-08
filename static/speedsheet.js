var KEY_ENTER = 13;
var KEY_ESCAPE = 27;
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;
// Handler for clicking on cells.
function onSelectCell(event) {
    var newCell = $(event.target);
    var newCoord = newCell.prop("id");
    // Get old coordinate and set new coordinate.
    var oldCoord = $("#coord").val();
    $("#coord").val(newCoord);
    // Adjust highlighted cell.
    if (!(oldCoord === "")) {
        $("#" + oldCoord).removeClass("table-primary");
    }
    newCell.addClass("table-primary");
    newCell.focus();
    // Copy cell value into input field.
    $("#formula").val(newCell.attr("data-formula"));
    $("#formula_fieldset").prop("disabled", true);
}
function onEditCell(event) {
    onSelectCell(event);
    $("#formula_fieldset").prop("disabled", false);
    $("#formula").focus();
    $("#formula").select();
}
function onKeypressCell(event) {
    if (event.which === KEY_ENTER) {
        $(event.target).dblclick();
    }
}
function onKeydownCell(event) {
    var oldCoord = event.target.id;
    var newCoord;
    switch (event.which) {
        case KEY_LEFT: {
            newCoord = String.fromCharCode(oldCoord.charCodeAt(0) - 1) + oldCoord.substring(1);
            break;
        }
        case KEY_UP: {
            var row = parseInt(oldCoord.substring(1));
            newCoord = oldCoord.charAt(0) + (row - 1).toString();
            break;
        }
        case KEY_RIGHT: {
            newCoord = String.fromCharCode(oldCoord.charCodeAt(0) + 1) + oldCoord.substring(1);
            break;
        }
        case KEY_DOWN: {
            var row = parseInt(oldCoord.substring(1));
            newCoord = oldCoord.charAt(0) + (row + 1).toString();
            break;
        }
        default:
            return;
    }
    $("#" + newCoord).click();
}
// Do this when everthing is loaded.
$(document).ready(function () {
    // Make log window as big as table.
    $("#log").outerHeight($("#sheet").outerHeight());
    // Install handler for clicking on table cells.
    $("td").each(function (_, cell) {
        $(cell).prop("tabindex", -1);
        $(cell).on("click", onSelectCell);
        $(cell).on("dblclick", onEditCell);
        $(cell).on("keypress", onKeypressCell);
        $(cell).on("keydown", onKeydownCell);
    });
    $("#formula").on("keypress", function (event) {
        if (event.which === KEY_ESCAPE) {
            var coord = $("#coord").val();
            $("#" + coord).click();
            event.preventDefault();
        }
    });
    var initCoord = $("#coord").val();
    $("#" + initCoord).click();
    // $("#formula_form").on("submit", function(event) {
    //   event.preventDefault();
    //   var coord = $("#coord").val();
    //   $("#" + coord).text($("#formula").val());
    // });
});
