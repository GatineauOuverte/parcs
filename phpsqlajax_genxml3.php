<?php
  
require("phpsqlajax_dbinfo.php"); 

// Start XML file, create parent node
$dom = new DOMDocument("1.0");
$dom->preserveWhiteSpace = false;
$dom->formatOutput = true;
$node = $dom->createElement("markers");
$parnode = $dom->appendChild($node); 

// Opens a connection to a MySQL server
$connection=mysql_connect ('localhost', $username, $password);
if (!$connection) {  die('Not connected : ' . mysql_error());} 

// Set the active MySQL database
$db_selected = mysql_select_db($database, $connection);
if (!$db_selected) {
  die ('Can\'t use db : ' . mysql_error());
}

$criterias ='INNER JOIN markers_installations mi ON m.id = mi.marker_id WHERE ';

$sectors_criteria = '';

$get_sectors = isset($_GET['sectors']);
if ($get_sectors) {
  $sectors = explode(",", $_GET['sectors']);
  for ($i = 0; $i <= count($sectors)-1 ; $i++) {
    if ($i == 0) {
      $sectors_criteria = $sectors_criteria.'sector=\''.$sectors[$i].'\' ';
    } else {
      $sectors_criteria = $sectors_criteria.'OR sector=\''.$sectors[$i].'\' ';
    }
  }
  
  $criterias = $criterias.'('.$sectors_criteria.')';
}else{
  $criterias = 'INNER JOIN markers_installations mi ON m.id = mi.marker_id WHERE 1=1';
}

$get_installation = isset($_GET['installations']);
if ($get_installation){
  $installations = explode(",", $_GET['installations']);
  for ($i = 0; $i <= count($installations)-1 ; $i++){   
    $criterias = $criterias.' AND mi.installation=\''.$installations[$i].'\' ';
  }
}

// Select all the rows in the markers table
$query = 'SELECT sector, name, address, lat, lng, type, m.installation FROM markers m ';

if ($get_installation || $get_sectors) {
  $query = $query.$criterias;
}

mysql_query("SET NAMES utf8");

$result = mysql_query($query);
if (!$result) {  
  die('Invalid query: ' . mysql_error());
} 


header("Content-Type: application/json; charset=utf8");

$arr = array();
while ($row = @mysql_fetch_assoc($result)){
    $arr[]=array(
      'sector'=>$row['sector'],
      'name'=>$row['name'],
      'address'=>$row['address'],
      'lat'=>$row['lat'],
      'lng'=>$row['lng'],
      'type'=>$row['type'],
      'installations'=>$row['installation']
    );
}

echo json_encode($arr);

mysql_close($connection);

?>
