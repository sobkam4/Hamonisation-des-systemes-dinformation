from django.core.management.base import BaseCommand

from apps.content.models import Category, Protocol, ProtocolStep
from apps.enterprise.models import Organization
from apps.training.models import Answer, Course, Lesson, Question, Quiz


class Command(BaseCommand):
    help = "Données de démo (protocole, cours, org)"

    def handle(self, *args, **options):
        cat, _ = Category.objects.get_or_create(slug="urgence", defaults={"name": "Urgence"})
        p, _ = Protocol.objects.get_or_create(
            slug="rcp",
            locale="fr",
            version=1,
            defaults={
                "title": "Massage cardiaque",
                "category": cat,
                "summary": "RCP adulte",
                "is_published": True,
            },
        )
        if p.steps.count() == 0:
            ProtocolStep.objects.create(
                protocol=p,
                order=0,
                title="Appeler les secours",
                body="15 / 112",
            )
            ProtocolStep.objects.create(
                protocol=p,
                order=1,
                title="Compressions",
                body="100-120 / min, profondeur 5-6 cm",
            )

        course, _ = Course.objects.get_or_create(
            slug="premiers-secours",
            defaults={
                "title": "Premiers secours",
                "description": "Intro",
                "locale": "fr",
                "is_published": True,
            },
        )
        if course.lessons.count() == 0:
            Lesson.objects.create(
                course=course,
                order=0,
                title="Repérer une victime inconsciente",
                body="Securité des lieux, réaction",
            )
        quiz = Quiz.objects.filter(course=course, title="Quiz intro").first()
        if not quiz:
            quiz = Quiz.objects.create(
                course=course, title="Quiz intro", pass_score_percent=50
            )
        if quiz.questions.count() == 0:
            q = Question.objects.create(quiz=quiz, order=0, text="Numéro SAMU ?")
            Answer.objects.create(question=q, text="15", is_correct=True)
            Answer.objects.create(question=q, text="17", is_correct=False)

        org, _ = Organization.objects.get_or_create(
            slug="demo-corp", defaults={"name": "Demo Corp"}
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"OK: protocol {p.slug}, course {course.slug}, org {org.slug}"
            )
        )
