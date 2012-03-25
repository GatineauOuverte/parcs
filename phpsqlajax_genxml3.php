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

// Select all the rows in the markers table
$query = "SELECT name, address, lat, lng, type, installation FROM markers WHERE 1 = 1";
mysql_query("SET NAMES utf8");
$result = mysql_query($query);
if (!$result) {  
  die('Invalid query: ' . mysql_error());
} 

header("Content-Type: application/json; charset=utf8");

 while ($row = @mysql_fetch_assoc($result)){
        $arr[]=array(
        'name'=>$row['name'],
        'address'=>$row['address'],
        'lat'=>$row['lat'],
        'lng'=>$row['lng'],
        'type'=>$row['type'],
        'installation'=>$row['installation'],
        );
    }
    echo json_encode($arr);
  
mysql_close($connection);

?>
