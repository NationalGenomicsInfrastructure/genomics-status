"""Handler for the Yield Calculator tool"""

from status.util import SafeHandler


class YieldCalculatorHandler(SafeHandler):
    """Serves the Yield Calculator page.

    Loaded through:
        /yield_calculator
    """

    def get(self):
        t = self.application.loader.load("yield_calculator.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )
