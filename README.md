# Git Downloader

This is a simple web application that allows users to download files from a git repository. This application lets users download either a single file, a directory, or the entire repository.

The application is built using Express.js leveraging the GitHub API to fetch the files from the repository.

## How to use

1. Go to the [Git Downloader](https://git-downloader.gopalsaraf.com/) website.
2. Enter the URL of the git repository.
   - For example:
     - To download entire repository: `https://github.com/GopalSaraf/learnML`
     - To download a directory: `https://github.com/GopalSaraf/learnML/tree/main/learnML/regression`
     - To download a single file: `https://github.com/GopalSaraf/learnML/blob/main/learnML/regression/linear_regression.py`
3. Click on the download button.
4. The file will be downloaded to your local machine.
