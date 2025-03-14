from status.util import SafeHandler


class HashTagCSVHandler(SafeHandler):
    def get(self):
        t = self.application.loader.load("hashtag_csv.html")

        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
            )
        )
