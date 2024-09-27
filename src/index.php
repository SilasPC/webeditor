<!DOCTYPE html>
<html>
	<body>
		<ul>
			<?php
				$files = scandir("./");
				foreach ($files as $file) {
					$type = is_dir($file) ? "dir" : "file";
					print("<li><a filetype=\"$type\" href=\"$file\">$file</a></li>\n");
				}
			?>
		</ul>
	</body>
</html>