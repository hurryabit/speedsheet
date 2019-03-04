// Do this when everthing is loaded.
$(document).ready(function() {
  // Enable tooltips.
  $('[data-toggle="tooltip"]').tooltip();

  // Make log window as big as table.
  $('#log').outerHeight($('#sheet').outerHeight());

  // Install handler for clicking on table cells.
  $('td').on('click', function() {
    // Get old coordinate and set new coordinate.
    var coord = $('#coord').val();
    $('#coord').val(this.id);

    // Adjust highlighted cell.
    if (!(coord === '')) {
      $('#' + coord).removeClass('table-primary');
    }
    $(this).addClass('table-primary');

    // Copy cell value into input field.
    $('#formula').val($(this).attr('data-title'));
  });

  // $('#formula_form').on('submit', function(event) {
  //   event.preventDefault();
  //   var coord = $('#coord').val();
  //   $('#' + coord).text($('#formula').val());
  // });
});
