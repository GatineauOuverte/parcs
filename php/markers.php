<?php

function clean($s) {
    return ("'" . mysql_escape_string( $s) . "'" );
};
  
require("dbinfo.php"); 

// Opens a connection to a MySQL server
$connection = mysql_connect('localhost', $username, $password)
    or die('Not connected : ' . mysql_error());

// Set the active MySQL database
$db_selected = mysql_select_db($database, $connection)
    or die('Can\'t use db : ' . mysql_error());

$query = '
    SELECT
        sector,
        name,
        address,
        lat,
        lng,
        type,
        installation
    FROM markers
    WHERE 1 = 1
';

if (array_key_exists('query', $_GET) and strlen($_GET['query'])) {
    $query = sprintf(
        "%s AND name LIKE '%%%s%%'",
        $query,
        mysql_real_escape_string($_GET['query'])
    );               
} else {
    
    if (array_key_exists('sectors', $_GET) and strlen($_GET['sectors'])) {
        $query = sprintf(
            "%s AND sector IN (%s)",
            $query,
            implode( ', ', array_map( "clean", explode(',', $_GET['sectors'])))
        );  
    }
    
    if (array_key_exists('installations', $_GET) and strlen($_GET['installations'])) {
        $installations = explode(',', $_GET['installations']);
        
        for ($i = 0; $i < count($installations); $i++) {
            $query = sprintf(
                "%s AND CONCAT(installation, ',') LIKE '%%%s,%%'",
                $query,
                mysql_real_escape_string($installations[$i])
            );
        }
    }
}

mysql_query("SET NAMES utf8");

$query = mysql_query($query)
    or die('Invalid query: ' . mysql_error());

header("Content-Type: application/json; charset=utf-8");

$result = array();

while ($row = @mysql_fetch_assoc($query)) {
    $result[] = array(
      'sector'=>$row['sector'],
      'name'=>$row['name'],
      'address'=>$row['address'],
      'lat'=>$row['lat'],
      'lng'=>$row['lng'],
      'type'=>$row['type'],
      'installations'=>$row['installation']
    );
}

echo json_encode($result);

mysql_close($connection);

?>
