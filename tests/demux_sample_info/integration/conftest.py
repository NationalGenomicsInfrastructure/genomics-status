def pytest_addoption(parser):
    parser.addoption(
        "--save-actual",
        action="store_true",
        default=False,
        help="Save actual samplesheet JSON to tcN_actual_samplesheets.json on assertion failure.",
    )
