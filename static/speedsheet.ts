enum Key {
    ENTER = 13,
    ESCAPE = 27,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
}

// Handler for clicking on cells.
function onSelectCell(event: Event) {
    const newCell: JQuery<Element> = $(event.target as Element);
    const newCoord = newCell.prop("id");

    // Get old coordinate and set new coordinate.
    const oldCoord: string = $("#coord").val() as string;
    $("#coord").val(newCoord);

    // Adjust highlighted cell.
    if (oldCoord !== "") {
        $("#" + oldCoord).removeClass("table-primary");
    }
    newCell.addClass("table-primary");
    newCell.focus();

    // Copy cell value into input field.
    $("#formula").val(newCell.attr("data-formula")!);

    $("#formula_fieldset").prop("disabled", true);
}

function onEditCell(event: Event) {
    onSelectCell(event);
    $("#formula_fieldset").prop("disabled", false);
    $("#formula").focus();
    $("#formula").select();
}

function onKeypressCell(event: any) {
    if (event.which === Key.ENTER) {
        $(event.target).dblclick();
    }
}

function onKeydownCell(event: any) {
    const oldCoord: string = (event.target as Element).id;
    let newCoord: string;

    switch (event.which) {
        case Key.LEFT: {
          newCoord = String.fromCharCode(oldCoord.charCodeAt(0) - 1) + oldCoord.substring(1);
          break;
        }
        case Key.UP: {
          const row = parseInt(oldCoord.substring(1), 10);
          newCoord = oldCoord.charAt(0) + (row - 1).toString();
          break;
        }
        case Key.RIGHT: {
          newCoord = String.fromCharCode(oldCoord.charCodeAt(0) + 1) + oldCoord.substring(1);
          break;
        }
        case Key.DOWN: {
          const row = parseInt(oldCoord.substring(1), 10);
          newCoord = oldCoord.charAt(0) + (row + 1).toString();
          break;
        }
        default:
            return;
    }

    $("#" + newCoord).click();
}

function selectedCell(): JQuery<HTMLElement> {
    const coord: string = $("#coord").val() as string;
    return $("#" + coord);
}

function log(msg: string) {
    const logArea = $("#log");
    logArea.val(logArea.val() + "\n" + msg);
    logArea.scrollTop(logArea[0].scrollHeight);
}

function clearLog() {
    $("#log").val("Computation log:");
}

// Do this when everthing is loaded.
$(document).ready(() => {
    // Make log window as big as table.
    $("#log").outerHeight($("#sheet").outerHeight()!);

    // Install handler for clicking on table cells.
    $("td").each((_, cell) => {
        $(cell).prop("tabindex", -1);

        $(cell).on("click", onSelectCell);
        $(cell).on("dblclick", onEditCell);
        $(cell).on("keypress", onKeypressCell);
        $(cell).on("keydown", onKeydownCell);
    });

    $("#formula").on("keydown", (event) => {
        console.log(event);
        if (event.which === Key.ESCAPE) {
            event.preventDefault();
            selectedCell().click();
        }
    });

    selectedCell().click()

    $("#clear").click(() => clearLog());
    clearLog();

    $("#formula_form").submit((event) => {
        event.preventDefault();
        $.ajax({
            data: $("#formula_form").serializeArray(),
            dataType: "json",
            method: "post",
            url: "update",
        })
        .done((data: Result<Log, string>) => {
          switch (data.kind) {
              case "Ok": {
                  log("> " + $("#coord").val() + " = " + $("#formula").val());
                  for (let entry of data.ok) {
                      $("#" + entry.coord).text(entry.to);
                      log(entry.coord + " = " + entry.to);
                  }
                  selectedCell().attr("data-formula", $("#formula").val() as string);
                  selectedCell().click();
                  break;
              }
              case "Err": {
                  alert(data.err);
                  break;
              }
              default: impossible(data);
          }
        })
        .fail((xhr, status, error) => { alert("Connection to server failed: " + error); });
    });
});

class Ok<T> {
    public kind: "Ok" = "Ok";
    public ok: T;
    constructor(ok: T) {
        this.ok = ok;
    }
}

interface LogEntry {
  coord: string;
  from: number;
  to: number;
}

type Log = Array<LogEntry>;

class Err<E> {
    public kind: "Err" = "Err";
    public err: E;
    constructor(err: E) {
        this.err = err;
    }
}

type Result <T, E> = Ok<T> | Err<E>;

function impossible(x: never): never {
    return x;
}
