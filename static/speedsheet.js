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
}
function onKeypressCell(event) {
    if (event.which === 13) {
        $(event.target).dblclick();
    }
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
    });
    $("#formula").on("keypress", function (event) {
        if (event.which === 27) {
            var coord = $("#coord").val();
            $("#" + coord).click();
            event.preventDefault();
        }
    });
    var initCoord = $("#coord").val();
    if (initCoord !== "") {
        $("#" + initCoord).click();
    }
    // $("#formula_form").on("submit", function(event) {
    //   event.preventDefault();
    //   var coord = $("#coord").val();
    //   $("#" + coord).text($("#formula").val());
    // });
});
