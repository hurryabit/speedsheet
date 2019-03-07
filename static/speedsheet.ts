// Handler for clicking on cells.
function onActivateCell(newCoord: string) {
    const newCell: JQuery<HTMLElement> = $("#" + newCoord);

    // Get old coordinate and set new coordinate.
    const oldCoord: string = $("#coord").val() as string;
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

function onEditCell(coord: string) {
    onActivateCell(coord);
    $("#formula_fieldset").prop("disabled", false);
    $("#formula").focus();
}

// Do this when everthing is loaded.
$(document).ready(() => {
    // Make log window as big as table.
    $("#log").outerHeight($("#sheet").outerHeight());

    // Install handler for clicking on table cells.
    $("td").each((_, cell) => {
        $(cell).prop("tabindex", -1);

        $(cell).on("click", (event: Event) => {
            onActivateCell((event.target as Element).id);
        });
        $(cell).on("dblclick", (event: Event) => {
            onEditCell((event.target as Element).id);
        });
        $(cell).on("keypress", (event) => {
            if (event.which === 13) {
                onEditCell((event.target as Element).id);
            }
        });
    });

    $("#formula").on("keypress", (event) => {
        if (event.which === 27) {
            const coord: string = $("#coord").val() as string;
            onActivateCell(coord);
            event.preventDefault();
        }
    });

    const initCoord: string = $("#coord").val() as string;
    if (initCoord !== "") {
      onActivateCell(initCoord);
    }

    // $("#formula_form").on("submit", function(event) {
    //   event.preventDefault();
    //   var coord = $("#coord").val();
    //   $("#" + coord).text($("#formula").val());
    // });
});
