// Handler for clicking on cells.
function onActivateCell(newCoord: string) {
  var newCell: JQuery<HTMLElement> = $('#' + newCoord);

  // Get old coordinate and set new coordinate.
  var oldCoord: string = <string>($('#coord').val());
  $('#coord').val(newCoord);

  // Adjust highlighted cell.
  if (!(oldCoord === '')) {
    $('#' + oldCoord).removeClass('table-primary');
  }
  newCell.addClass('table-primary');

  // Copy cell value into input field.
  $('#formula').val(newCell.attr('data-formula'));
}

// Do this when everthing is loaded.
$(document).ready(function() {
  // Make log window as big as table.
  $('#log').outerHeight($('#sheet').outerHeight());

  // Install handler for clicking on table cells.
  $('td').on('click', function() { onActivateCell(this.id); });

  // $('#formula_form').on('submit', function(event) {
  //   event.preventDefault();
  //   var coord = $('#coord').val();
  //   $('#' + coord).text($('#formula').val());
  // });
});
