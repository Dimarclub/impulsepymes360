#!/bin/bash
# Switch schema to sqlite for local dev (DO NOT COMMIT the sqlite version)
cd /home/z/my-project
sed -i 's|provider = "postgresql"|provider = "sqlite"|' prisma/schema.prisma
echo "Schema switched to SQLITE for local dev"
echo "IMPORTANT: Switch back to postgresql before pushing to GitHub!"
