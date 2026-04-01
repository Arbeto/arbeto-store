<?php

symlink('/home/admin/shared/app', 'app');
symlink('/home/admin/shared/config', 'config');
symlink('/home/admin/shared/database', 'database');
symlink('/home/admin/shared/node_modules', 'node_modules');
symlink('/home/admin/shared/tests', 'tests');
symlink('/home/admin/shared/vendor', 'vendor');

echo "Symlinks created successfully.";
