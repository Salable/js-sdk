#! /bin/sh

# 1. Get the current version of the root NPM package version
version=$(echo $npm_package_version)

# 2. cd into the packages sub-directory
cd ./packages

# 3. Loop over each package and update it's package.json version to be the same as root
for d in */ ; do
    sed -i 's/"version":.*/"version": "'$version'",/' $d/package.json
done

# 4. cd back to the root directory
cd ..