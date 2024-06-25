package org.hathitrust.tools;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

import org.apache.commons.io.*;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.form.PDFormXObject;
import org.apache.pdfbox.pdmodel.graphics.optionalcontent.PDOptionalContentGroup;
import org.apache.pdfbox.pdmodel.graphics.optionalcontent.PDOptionalContentProperties;

import org.apache.pdfbox.multipdf.LayerUtility;
import org.apache.pdfbox.util.Matrix;

import com.eclipsesource.json.Json;
import com.eclipsesource.json.JsonValue;
import com.eclipsesource.json.JsonObject;


/**
 * Add watermarks to born-digital PDFs.
 */
public class Stamper {

    private static final Log LOG = LogFactory.getLog(Stamper.class);

    private static final String STARTING = "STARTING";
    private static final String RUNNING = "RUNNING";
    private static final String DONE = "DONE";

    private String updateFilePath = null;
    private String outputFileName = null;
    private String downloadUrl = null;
    private JsonObject updater = Json.object();
    private JsonObject config;

    private PDDocument targetDoc;
    private PDDocument stamperDoc;
    private PDDocument importDoc;
    private boolean insertColophon = true;


    private Stamper(String filename) throws IOException {
        readConfig(filename);
    }

    public static void main(String[] args) throws IOException {
        // suppress the Dock icon on OS X
        System.setProperty("apple.awt.UIElement", "true");

        try {

            Stamper stamper = new Stamper(args[0]);
            stamper.run();


        } catch (IOException e) {
            LOG.error("Stamp FAIL: " + e.getMessage(), e);
            throw e;
        }
    }

    private static void usage() {
        System.err.println("FAIL");
        System.exit(1);
    }

    private void run() throws IOException {
        // readConfig(args[0]);
        loadStamperDoc();
        loadTargetDoc();
        initializeUpdater();
        process();
        insertColophonPage();
        finish();
    }

    private void readConfig(String configFileName) throws IOException {
        FileInputStream configInputStream = new FileInputStream(configFileName);
        String config_string = IOUtils.toString(configInputStream);
        config = Json.parse(config_string).asObject();
        outputFileName = config.get("output_filename").asString();
    }

    private void loadStamperDoc() throws IOException {
        String stamperFileName = config.get("stamper_filename").asString();
        stamperDoc = PDDocument.load(new File(stamperFileName));
    }

    private void loadTargetDoc() throws IOException {
        String inputFileName = config.get("input_filename").asString();
        JsonValue pages = config.get("pages");

        if (pages != null && !pages.isNull() && pages.asArray().size() > 0) {
            targetDoc = new PDDocument();
            importDoc = PDDocument.load(new File(inputFileName));
            for (JsonValue value : pages.asArray()) {
                int page_num = value.asInt();
                PDPage page = importDoc.getPage(page_num);
                targetDoc.importPage(page);
            }

            insertColophon = !(pages.asArray().size() == 1);
        }

        if (targetDoc == null) {
            targetDoc = PDDocument.load(new File(inputFileName));
        }
    }

    private void initializeUpdater() {
        JsonValue update_filepath = config.get("update_filepath");
        if (update_filepath != null && update_filepath.isString()) {
            updateFilePath = config.get("update_filepath").asString();

            File d = new File(updateFilePath);
            if ( ! d.exists() ) {
                d.mkdirs();
            }

            downloadUrl = config.get("download_url").asString();
        }
        updater.add("total_pages", targetDoc.getNumberOfPages()).add("download_url", downloadUrl);
    }

    private PDFormXObject importFormFromStamper() throws IOException {
        // Create a Form XObject from the source document using LayerUtility
        LayerUtility layerUtility = new LayerUtility(targetDoc);
        return layerUtility.importPageAsForm(stamperDoc, 1);
    }

    private PDOptionalContentGroup installOptionalContentGroup() {
        PDDocumentCatalog catalog = targetDoc.getDocumentCatalog();
        PDOptionalContentProperties ocprops = catalog.getOCProperties();
        if (ocprops == null) {
            ocprops = new PDOptionalContentProperties();
            catalog.setOCProperties(ocprops);
        }
        String layerName = "Watermark";
        if (ocprops.hasGroup(layerName)) {
            throw new IllegalArgumentException("Optional group (layer) already exists: " + layerName);
        }

        PDOptionalContentGroup layer = new PDOptionalContentGroup(layerName);
        ocprops.addGroup(layer);
        return layer;
    }

    private void process() throws IOException {
        PDFormXObject form = importFormFromStamper();
        PDOptionalContentGroup layer = installOptionalContentGroup();

        updateProgressMonitor(STARTING);

        for (PDPage targetPage : targetDoc.getPages()) {
            PDPageContentStream contentStream = new PDPageContentStream(
                    targetDoc, targetPage, PDPageContentStream.AppendMode.APPEND, false);

            Matrix matrix = Matrix.getScaleInstance(
                    targetPage.getMediaBox().getWidth() / form.getBBox().getWidth(),
                    targetPage.getMediaBox().getHeight() / form.getBBox().getHeight()
            );

            contentStream.beginMarkedContent(COSName.OC, layer);
            contentStream.saveGraphicsState();
            contentStream.transform(matrix);
            contentStream.drawForm(form);
            contentStream.restoreGraphicsState();
            contentStream.endMarkedContent();
            contentStream.close();

            updateProgressMonitor(RUNNING);
        }
    }

    private void insertColophonPage() throws IOException {
        if (insertColophon) {
            PDPage colophonPage = stamperDoc.getPage(0);
            PDPage firstPage = targetDoc.getDocumentCatalog().getPages().get(0);
            targetDoc.getDocumentCatalog().getPages().insertBefore(colophonPage, firstPage);
        }
    }

    private void finish() throws IOException {
        targetDoc.save(outputFileName);
        targetDoc.close();
        stamperDoc.close();
        if ( importDoc != null ) {
            importDoc.close();
        }
        updateProgressMonitor(DONE);
    }

    private void updateProgressMonitor(String status) throws IOException {
        if (updateFilePath == null) {
            return;
        }
        updater.set("status", status);
        String updateFileName;
        if (status == RUNNING) {
            updater.set("current_page", updater.getInt("current_page", 0) + 1);
            updateFileName = String.format("%04d.js", updater.get("current_page").asInt());
        } else {
            updateFileName = status + ".js";
        }
        // System.err.println(updater.toString() + "\n");

        File updateFile = new File(updateFilePath + "/" + updateFileName);
        FileUtils.writeStringToFile(updateFile, updater.toString());
    }
}
