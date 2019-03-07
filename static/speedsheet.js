// Handler for clicking on cells.
function onSelectCell(newCoord) {
    var newCell = $("#" + newCoord);
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
function onEditCell(coord) {
    onSelectCell(coord);
    $("#formula_fieldset").prop("disabled", false);
    $("#formula").focus();
}
// Do this when everthing is loaded.
$(document).ready(function () {
    // Make log window as big as table.
    $("#log").outerHeight($("#sheet").outerHeight());
    // Install handler for clicking on table cells.
    $("td").each(function (_, cell) {
        $(cell).prop("tabindex", -1);
        $(cell).on("click", function (event) {
            onSelectCell(event.target.id);
        });
        $(cell).on("dblclick", function (event) {
            onEditCell(event.target.id);
        });
        $(cell).on("keypress", function (event) {
            if (event.which === 13) {
                onEditCell(event.target.id);
            }
        });
    });
    $("#formula").on("keypress", function (event) {
        if (event.which === 27) {
            var coord = $("#coord").val();
            onSelectCell(coord);
            event.preventDefault();
        }
    });
    var initCoord = $("#coord").val();
    if (initCoord !== "") {
        onSelectCell(initCoord);
    }
    // $("#formula_form").on("submit", function(event) {
    //   event.preventDefault();
    //   var coord = $("#coord").val();
    //   $("#" + coord).text($("#formula").val());
    // });
});
