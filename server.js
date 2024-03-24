import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import JSZip from "jszip";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const token = process.env.GITHUB_TOKEN;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const fetchContent = async (url) => {
  const response = await fetch(url, {
    headers: token ? { Authorization: `token ${token}` } : {},
  });

  return response;
};

app.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const urlParts = url.split("/");
  const username = urlParts[3];
  const repoName = urlParts[4].split(".git")[0];
  const path = urlParts.slice(7).join("/").replaceAll("%20", " ");

  const apiURL = `https://api.github.com/repos/${username}/${repoName}/contents/${path}`;

  try {
    const response = await fetchContent(apiURL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch repository contents: ${response.statusText}`
      );
    }
    const data = await response.json();

    if (Array.isArray(data)) {
      const addFileToZip = async (zip, file) => {
        const downloadURL = file.download_url;
        const filePath = file.path;

        const fileContent = await fetchContent(downloadURL).then((res) =>
          res.buffer()
        );
        zip.file(filePath.replace(path, ""), fileContent);
      };

      const zip = new JSZip();

      const files = [];
      const folders = [];

      for (const file of data) {
        if (file.type === "file") {
          files.push(file);
        }

        if (file.type === "dir") {
          folders.push(file);
        }
      }

      const fetchFiles = async (folder) => {
        const folderURL = folder.url;
        const response = await fetchContent(folderURL);
        const data = await response.json();

        if (Array.isArray(data)) {
          for (const file of data) {
            if (file.type === "file") {
              files.push(file);
            }

            if (file.type === "dir") {
              await fetchFiles(file);
            }
          }
        } else {
          files.push(data);
        }
      };

      await Promise.all(folders.map((folder) => fetchFiles(folder)));
      await Promise.all(files.map((file) => addFileToZip(zip, file)));

      const content = await zip.generateAsync({ type: "nodebuffer" });
      res.set("Content-Type", "application/zip");

      const downloadFileName =
        path !== "" ? `${repoName}_${path}.zip` : `${repoName}.zip`;
      res.set(
        "Content-Disposition",
        `attachment; filename="${downloadFileName}"`
      );
      res.send(content);
    } else {
      const downloadURL = data.download_url;
      const fileName = data.name;
      const fileMimeType = data.name.split(".").pop();

      const fileContent = await fetchContent(downloadURL).then((res) =>
        res.buffer()
      );
      res.set("Content-Type", `application/${fileMimeType}`);
      res.set("Content-Disposition", `attachment; filename="${fileName}"`);
      res.send(fileContent);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
