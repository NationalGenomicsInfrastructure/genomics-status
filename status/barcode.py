"""Handlers related to test for barcode printing
"""
from __future__ import print_function
import subprocess
import tornado.web
import json
from datetime import datetime
from dateutil import parser
from collections import Counter
from status.util import SafeHandler
import re

class BarcodeHandler(SafeHandler):
    """ Main script to print barcode and other plate labels on the barcode printer
        Zebra located in the big lab at NGI
        can distinguish between
            - already existing barcode file
            - text file
            - text input
    """
    def get(self):
        t = self.application.loader.load("barcode.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user()))

    def post(self):
        # how often is the label(s) to be printed? Default: 1
        copies = int(self.get_argument('copies'))

        # printing from file input
        try: # figure out if a file was entered in the form
            file_for_printing = self.request.files['file_to_print']
        except KeyError: # form entry for file was empty
            print("no file was given")
        else: #form entry for file was not empty
            #retrieve file and transform the contained text to string format with utf-8 encoding
            linesToPrint = str(file_for_printing[0]['body'], encoding='utf-8')
            #check if file is already a label format file
            barcodeFileMatch = re.compile('^\^XA')
            isBarcodeFile = re.search(barcodeFileMatch, linesToPrint)
            if isBarcodeFile: # if the file is already in the correct format it can be immediately moved to print
                for _ in range(copies): # loops over copies to print
                    print_barcode(linesToPrint)
            else: # file submitted is a text file
                array_linesToPrint = linesToPrint.splitlines() # split into the different lines of the text file
                for line in array_linesToPrint:
                    createdLabel = makeBarcode(line, match_barcode(line, False))
                    createdLabel_joined = '\n'.join(createdLabel)
                    for _ in range(copies): # loops over copies to print
                        print_barcode(createdLabel_joined)

        # printing from string input
        text_for_printing = self.get_argument('text_to_print') # retrieves string from form
        if len(text_for_printing) > 0 : # check wether there was an entry or not
            createdLabel = makeBarcode(text_for_printing, match_barcode(text_for_printing, False))
            createdLabel_joined = '\n'.join(createdLabel)
            for _ in range(copies): # loops over copies to print
                print_barcode(createdLabel_joined)
        else:
            print("no text was given")

        self.set_status(200)
        self.set_header("Content-type", "application/json")
        self.finish()


def makeBarcode(label, print_bc):
    # prints the formated label to be piped to the barcode printer
    formattedLabel = []
    formattedLabel.append("^XA") # start of label
    formattedLabel.append("^DFFORMAT^FS") # download and store format, name of format, end of field data (FS = field stop)
    formattedLabel.append("^LH0,0") # label home position (label home = LH)
    if print_bc:
        formattedLabel.append("^FO360,35^AFN,60,20^FN1^FS") # AF = assign font F, field number 1 (FN1), print text at position field origin (FO) rel. to home
        formattedLabel.append("^FO80,35^BCN,70,N,N^FN2^FS") # BC=barcode 128, field number 2, normal orientation, height 70, no interpretation line.
    else:
        ch_size = "40"
        yposition = 42
        if len(label) > 32:
            ch_size = 24
            yposition = 50
        elif len(label) < 20:
            ch_size = 60
            yposition = 35
        # Scalable font ^A0N,32,32 should fit roughly 42 chars on our current labels
        formattedLabel.append("^FO20,{0}^A0N,{1},{1}^FB640,1,0,C,0^FN1^FS".format(yposition, ch_size)) # FO = x,y relative field origin; A0N = scalable font height,width; FB = make into one line field block and center
    formattedLabel.append("^XZ") # end format
    formattedLabel.append("^XA") # start of label format
    formattedLabel.append("^XFFORMAT^FS") # label home posision
    formattedLabel.append("^FN1^FD{}^FS".format(label)) # this is readable
    if print_bc:
        formattedLabel.append("^FN2^FD{}^FS".format(label)) # this is the barcode
    formattedLabel.append("^XZ")
    return(formattedLabel)

def match_barcode(string_to_match, default_value):
    #identifies plate IDs as created by LIMS and returns boolean
    barcode_match = re.compile('\d{2}-\d{6}')
    match = re.search(barcode_match, string_to_match)
    if match:
        isbarcode = True
    else:
        isbarcode = default_value
    return(isbarcode)

def print_barcode(barcodeFile):
    print('Ready to call lp for printing.')
    lp_args = ["lp"]
    lp_args.extend(["-d", "Zebra"])
    lp_args.append("-")  # lp accepts stdin if '-' is given as filename
    sp = subprocess.Popen(lp_args,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE)
    sp.stdin.write(barcodeFile.encode('utf-8'))
    print('lp command is called for printing.')
    stdout,stderr = sp.communicate()  # Will wait for sp to finish
    print('lp stdout: {0}'.format(stdout))
    sp.stdin.close()
