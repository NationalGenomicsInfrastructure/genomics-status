"""Handlers related to test for barcode printing
"""

import subprocess
from status.util import SafeHandler
import re


class BarcodeHandler(SafeHandler):
    """Main script to print barcode and other plate labels on the barcode printer
    Zebra located in the big lab at NGI
    can distinguish between
        - already existing barcode file
        - text file
        - text input

    The second part prints user labels with barcodes to be send out together with
    plates. The options are as follows:
        - plate number start. i.e. P1
        - plate number end. i.e. P5
        - number of projects
    Separate labels will be printed for the range between plate number start and plate
    number end. Further, if more than one project is to be printed, the project number
    increases by one and the chosen plate numbers will be printed for the additional
    projects
    """

    def get(self):
        t = self.application.loader.load("barcode.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )

    def post(self):
        # some variable will only be attempted to be read if a specific form is submitted
        labelType = self.get_argument("formType")
        if labelType == "lab_labels":
            # how often is the label(s) to be printed? Default: 1
            copies = int(self.get_argument("copies"))
            # printing from file input
            if self.request.files.get(
                "file_to_print"
            ):  # figure out if a file was entered in the form
                file_for_printing = self.request.files["file_to_print"]
                # retrieve file and transform the contained text to string format with utf-8 encoding
                linesToPrint = str(file_for_printing[0]["body"], encoding="utf-8")
                # check if file is already a label format file
                if re.compile(r"^\^XA").search(linesToPrint):
                    for _ in range(copies):  # loops over copies to print
                        print_barcode(linesToPrint)
                else:  # file submitted is a text file
                    for (
                        line
                    ) in (
                        linesToPrint.splitlines()
                    ):  # split into the different lines of the text file
                        if self.get_argument(
                            "print_with_barcode", ""
                        ):  # is true when barcode box is ticked
                            createdLabel = make_barcode(line, match_barcode(line, True))
                        else:
                            createdLabel = make_barcode(
                                line, match_barcode(line, False)
                            )
                        createdLabel_joined = "\n".join(createdLabel)
                        for _ in range(copies):  # loops over copies to print
                            print_barcode(createdLabel_joined)
            else:
                print("no file was given")

            # printing from string input
            text_for_printing = self.get_argument(
                "text_to_print"
            )  # retrieves string from form
            if len(text_for_printing) > 0:  # check wether there was an entry or not
                if self.get_argument(
                    "print_with_barcode", ""
                ):  # is true when barcode box is ticked
                    createdLabel = make_barcode(
                        text_for_printing, match_barcode(text_for_printing, True)
                    )
                else:
                    createdLabel = make_barcode(
                        text_for_printing, match_barcode(text_for_printing, False)
                    )
                createdLabel_joined = "\n".join(createdLabel)
                for _ in range(copies):  # loops over copies to print
                    print_barcode(createdLabel_joined)
            else:
                print("no text was given")

            statusType = 200
            message = {"message": "Submitted to printer!"}

        elif labelType == "user_labels":
            # printing user project Labels
            user_project_ID = self.get_argument("projectLabel_to_print")
            startP = self.get_argument(
                "plate_start"
            )  # choose the plate number to start, default = 1
            endP = self.get_argument(
                "plate_end"
            )  # choose the plate number to end, default = 5
            # if labels for more than one project are to be printed, this prints another
            # set of barcodes by adding one to the previous project number
            projectNo = self.get_argument("numberOfProjects")

            if len(user_project_ID) > 0:  # check that there is an entry
                if re.compile(r"^P\d+$").search(user_project_ID):
                    projectNo_only_extracted = re.search(
                        "P(.*)", user_project_ID
                    ).group(
                        1
                    )  # have only the number of the project ID
                    for projects in range(0, int(projectNo)):
                        new_projectNo = int(projectNo_only_extracted) + projects
                        new_projectID = "P" + str(new_projectNo)
                        for plate in range(int(startP), (int(endP) + 1)):
                            new_projectID_plate = (
                                new_projectID + "P" + str(plate)
                            )  # adding the plate number
                            project_barcode = make_barcode(new_projectID_plate, True)
                            createdProjectLabel_joined = "\n".join(project_barcode)
                            print_barcode(createdProjectLabel_joined)
                    statusType = 200
                    message = {"message": "Submitted to printer!"}
                else:
                    statusType = 400
                    message = {
                        "Error": 'please enter a valid user ID, it should start with "P", followed by numbers (e.g. P12345)'
                    }
            else:
                statusType = 400
                message = {"Error": "no user project ID was given"}
        self.set_status(statusType)
        self.set_header("Content-type", "application/json")
        self.finish(message)


def make_barcode(label, print_bc):
    # prints the formated label to be piped to the barcode printer
    formattedLabel = []
    formattedLabel.append("^XA")  # start of label
    formattedLabel.append(
        "^DFFORMAT^FS"
    )  # download and store format, name of format, end of field data (FS = field stop)
    formattedLabel.append("^LH0,0")  # label home position (label home = LH)
    if print_bc:
        ch_size = "20"
        xpositionText = "360"
        textHeight = "50"
        if len(label) > 9:
            ch_size = "10"  # squeezes the text for long texts
            xpositionText = "440"  # moves the text position because the bc is longer
            textHeight = "38"
        formattedLabel.append(
            "^FO{0},27^AFN,{1},{2}^FN1^FS".format(xpositionText, textHeight, ch_size)
        )  # AF = assign font F, field number 1 (FN1), print text at position field origin (FO) rel. to home
        formattedLabel.append(
            "^FO80,17^BCN,70,N,N^FN2^FS"
        )  # BC=barcode 128, field number 2, normal orientation, height 70, no interpretation line.
    else:
        ch_size = "40"
        yposition = "35"
        if len(label) > 32:
            ch_size = "24"
            yposition = "40"
        elif len(label) < 20:
            ch_size = "50"
            yposition = "30"
        # Scalable font ^A0N,32,32 should fit roughly 42 chars on our current labels
        formattedLabel.append(
            "^FO20,{0}^A0N,{1},{1}^FB640,1,0,C,0^FN1^FS".format(yposition, ch_size)
        )  # FO = x,y relative field origin; A0N = scalable font height,width; FB = make into one line field block and center
    formattedLabel.append("^XZ")  # end format
    formattedLabel.append("^XA")  # start of label format
    formattedLabel.append("^XFFORMAT^FS")  # label home posision
    formattedLabel.append("^FN1^FD{}^FS".format(label))  # this is readable
    if print_bc:
        formattedLabel.append("^FN2^FD{}^FS".format(label))  # this is the barcode
    formattedLabel.append("^XZ")
    return formattedLabel


def match_barcode(string_to_match, default_value):
    # identifies plate IDs as created by LIMS and returns boolean
    if re.compile(r"\d{2}-\d{6}").search(string_to_match):
        isbarcode = True
    else:
        isbarcode = default_value
    return isbarcode


def print_barcode(barcodeFile):
    print("Ready to call lp for printing.")
    lp_args = ["lp"]
    lp_args.extend(["-d", "Zebra"])
    lp_args.append("-")  # lp accepts stdin if '-' is given as filename
    sp = subprocess.Popen(
        lp_args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    sp.stdin.write(barcodeFile.encode("utf-8"))
    print("lp command is called for printing.")
    stdout, stderr = sp.communicate()  # Will wait for sp to finish
    print("lp stdout: {0}".format(stdout))
    sp.stdin.close()
