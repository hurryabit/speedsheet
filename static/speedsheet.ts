const KEY_ENTER: number = 13;
const KEY_ESCAPE: number = 27;
const KEY_LEFT: number = 37;
const KEY_UP: number = 38;
const KEY_RIGHT: number = 39;
const KEY_DOWN: number = 40;

// Handler for clicking on cells.
function onSelectCell(event: Event) {
    const newCell: JQuery<Element> = $(event.target as Element);
    const newCoord = newCell.prop("id");

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

function onEditCell(event: Event) {
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
    const oldCoord: string = (event.target as Element).id;
    let newCoord: string;

    switch (event.which) {
        case KEY_LEFT: {
          newCoord = String.fromCharCode(oldCoord.charCodeAt(0) - 1) + oldCoord.substring(1);
          break;
        }
        case KEY_UP: {
          const row = parseInt(oldCoord.substring(1));
          newCoord = oldCoord.charAt(0) + (row - 1).toString();
          break;
        }
        case KEY_RIGHT: {
          newCoord = String.fromCharCode(oldCoord.charCodeAt(0) + 1) + oldCoord.substring(1);
          break;
        }
        case KEY_DOWN: {
          const row = parseInt(oldCoord.substring(1));
          newCoord = oldCoord.charAt(0) + (row + 1).toString();
          break;
        }
        default:
            return;
    }

    $("#" + newCoord).click();
}

// Do this when everthing is loaded.
$(document).ready(() => {
    // Make log window as big as table.
    $("#log").outerHeight($("#sheet").outerHeight());

    // Install handler for clicking on table cells.
    $("td").each((_, cell) => {
        $(cell).prop("tabindex", -1);

        $(cell).on("click", onSelectCell);
        $(cell).on("dblclick", onEditCell);
        $(cell).on("keypress", onKeypressCell);
        $(cell).on("keydown", onKeydownCell);
    });

    $("#formula").on("keypress", (event) => {
        if (event.which === KEY_ESCAPE) {
            const coord: string = $("#coord").val() as string;
            $("#" + coord).click();
            event.preventDefault();
        }
    });

    const initCoord: string = $("#coord").val() as string;
    if (initCoord !== "") {
      $("#" + initCoord).click();
    }

    // $("#formula_form").on("submit", function(event) {
    //   event.preventDefault();
    //   var coord = $("#coord").val();
    //   $("#" + coord).text($("#formula").val());
    // });
});
