package org.hathitrust.stamper;

import com.eclipsesource.json.Json;
import com.eclipsesource.json.JsonObject;
import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;


/**
 * Unit test for simple Stamper.
 */
public class StamperTest
    extends TestCase
{
    /**
     * Create the test case
     *
     * @param testName name of the test case
     */
    public StamperTest(String testName )
    {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite()
    {
        return new TestSuite( StamperTest.class );
    }

    /**
     * Rigourous Test :-)
     */
    public void testApp()
    {
        assertTrue( true );
    }

    public void testAllStamp() throws Exception {
        PDDocument originalDoc = PDDocument.load(new File("src/test/resources/org/hathitrust/stamper/alice-in-wonderland.pdf"));
        int originalDocPages = originalDoc.getNumberOfPages();
        originalDoc.close();

        org.hathitrust.tools.Stamper.main(new String[]{"src/test/resources/org/hathitrust/stamper/all_config.js"});
        PDDocument outputDoc = PDDocument.load(new File("/tmp/all_output.pdf"));
        int outputDocPages = outputDoc.getNumberOfPages();

        outputDoc.close();

        assertTrue(outputDocPages == originalDocPages + 1); // for colophon
    }

    public void testPartialStamp() throws Exception {

        org.hathitrust.tools.Stamper.main(new String[]{"src/test/resources/org/hathitrust/stamper/partial_config.js"});
        PDDocument outputDoc = PDDocument.load(new File("/tmp/partial_output.pdf"));
        int outputDocPages = outputDoc.getNumberOfPages();

        outputDoc.close();

        assertTrue(outputDocPages == 4); // 3 pages + colophon
    }

    public void testSingleStamp() throws Exception {

        org.hathitrust.tools.Stamper.main(new String[]{"src/test/resources/org/hathitrust/stamper/single_config.js"});
        PDDocument outputDoc = PDDocument.load(new File("/tmp/single_output.pdf"));
        int outputDocPages = outputDoc.getNumberOfPages();

        outputDoc.close();

        assertTrue(outputDocPages == 1); // no colophon
    }

    public void testUpdateStamp() throws Exception {

        PDDocument originalDoc = PDDocument.load(new File("src/test/resources/org/hathitrust/stamper/alice-in-wonderland.pdf"));
        int originalDocPages = originalDoc.getNumberOfPages();
        originalDoc.close();

        // modify config so we can randomize the update_filepath
        Path tempUpdatePath = Files.createTempDirectory("update");
        FileInputStream configInputStream = new FileInputStream("src/test/resources/org/hathitrust/stamper/update_config.js");
        String config_string = IOUtils.toString(configInputStream);
        JsonObject config = Json.parse(config_string).asObject();
        config.set("update_filepath", tempUpdatePath.toString());

        File tempConfigFile = File.createTempFile("config", ".js");
        FileUtils.writeStringToFile(tempConfigFile, config.toString());


        org.hathitrust.tools.Stamper.main(new String[]{tempConfigFile.getAbsolutePath()});
        PDDocument outputDoc = PDDocument.load(new File("/tmp/update_full_output.pdf"));
        int outputDocPages = outputDoc.getNumberOfPages();

        outputDoc.close();

        File temp = new File(tempUpdatePath.toString());
        File[] files = temp.listFiles();

        boolean didFindStart = false;
        boolean didFindDone = false;
        int i = 0;
        for(File file:files) {
            i += 1;
            if ( file.getAbsolutePath().endsWith("STARTING.js") ) {
                didFindStart = true;
            } else if ( file.getAbsolutePath().endsWith("DONE.js") ) {
                didFindDone = true;
            }
        }

        assertTrue(outputDocPages == originalDocPages + 1); // for colophon
        assertTrue(i == outputDocPages + 1); // all pages + colophon + DONE
        assertTrue(didFindStart);
        assertTrue(didFindDone);


    }

}
