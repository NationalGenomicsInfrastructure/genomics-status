from status.util import SafeHandler


class NGISwedenHandler(SafeHandler):
    """Handles the yield_plot page

    Loaded through /ngisweden_stats
    """

    def get(self):
        t = self.application.loader.load("ngisweden_stats.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )
