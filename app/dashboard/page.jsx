"use client";

// ============================================================
// Dashboard - Learning Cockpit (Taste Skill Anti-Slop Edition)
// Displays learner progression, telemetry metrics, module matrix,
// and quick resume controls across local & synced database states.
// ============================================================

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Container } from "react-bootstrap";
import { useUser } from "@/components/UserContext";
import ProgressRing from "@/components/ProgressRing";
import CalphyMascot from "@/components/CalphyMascot";
import Reveal from "@/components/Reveal";
import { LESSONS, UNITS } from "@/lib/lessons";
import { QUIZZES, quizLabel } from "@/lib/quizzes";
import {
  lessonStatus,
  quizScore,
  quizStatus,
  overallPercent,
  resetLocalProgress,
} from "@/lib/progress";

export default function DashboardPage() {
  const { user, isLoggedIn, authLoading, progress, logout, refreshProgress } =
    useUser();
  const [dbStatus, setDbStatus] = useState(isLoggedIn ? "checking" : "guest");
  const [resettingDb, setResettingDb] = useState(false);
  const [dbResetMessage, setDbResetMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "in_progress" | "completed" | "quizzes"
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isLoggedIn) {
        setDbStatus("guest");
        return;
      }
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        if (alive) setDbStatus(res.ok ? "online" : "offline");
      } catch {
        if (alive) setDbStatus("offline");
      }
    })();
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  // Telemetry computations
  const lessonsDone = useMemo(
    () => LESSONS.filter((l) => lessonStatus(progress, l.key) === "Finished").length,
    [progress]
  );

  const quizzesDone = useMemo(
    () => QUIZZES.filter((q) => quizStatus(progress, q.id) === "Finished").length,
    [progress]
  );

  const quizScores = useMemo(
    () => QUIZZES.map((q) => quizScore(progress, q.id)),
    [progress]
  );

  const avgScore = useMemo(
    () =>
      quizzesDone
        ? Math.round(
            quizScores.filter((s) => s > 0).reduce((a, b) => a + b, 0) /
              quizzesDone
          )
        : 0,
    [quizzesDone, quizScores]
  );

  const overall = useMemo(() => overallPercent(progress), [progress]);
  const finalExam = useMemo(
    () => QUIZZES.find((q) => q.final) || QUIZZES[QUIZZES.length - 1],
    []
  );

  // Learner Mastery Rank
  const masteryRank = useMemo(() => {
    if (overall === 100) return { title: "Grandmaster", badge: "Gold Tier", color: "var(--ember)" };
    if (overall >= 75) return { title: "Scholar", badge: "Silver Tier", color: "var(--cool)" };
    if (overall >= 40) return { title: "Apprentice", badge: "Bronze Tier", color: "var(--good)" };
    if (overall > 0) return { title: "Explorer", badge: "Novice", color: "var(--ink-soft)" };
    return { title: "New Cadet", badge: "Unranked", color: "var(--muted)" };
  }, [overall]);

  // Next recommended action
  const nextUp = useMemo(() => {
    // Check if there is an in-progress or unstarted lesson
    const nextLesson = LESSONS.find(
      (l) => lessonStatus(progress, l.key) !== "Finished"
    );
    if (nextLesson) {
      const st = lessonStatus(progress, nextLesson.key);
      return {
        type: "lesson",
        tag: st === "Current" ? "IN PROGRESS" : "NEXT MILESTONE",
        title: `Lesson ${nextLesson.n}: ${nextLesson.title}`,
        subtitle: nextLesson.tagline,
        url: `/lessons/${nextLesson.slug}`,
        btnText: st === "Current" ? "Resume Lesson →" : "Start Lesson →",
      };
    }

    // If all lessons are done, check final exam
    const finalStatus = finalExam ? quizStatus(progress, finalExam.id) : "Finished";
    if (finalStatus !== "Finished" && finalExam) {
      return {
        type: "final",
        tag: "FINAL EXAM",
        title: "Comprehensive Final Exam",
        subtitle: "9 units covered. Complete the final challenge to unlock full mastery.",
        url: `/quizzes/${finalExam.slug}`,
        btnText: "Take Final Exam →",
      };
    }

    // Fully completed
    return {
      type: "complete",
      tag: "COMPLETED",
      title: "All Modules Mastered!",
      subtitle: "You've finished every lesson and passed all quizzes.",
      url: "/simulations",
      btnText: "Explore 3D Labs →",
    };
  }, [progress, finalExam]);

  const resetDatabaseProgress = async () => {
    if (
      !window.confirm(
        "Reset all progress in your account database? This affects your account on all devices."
      )
    ) {
      return;
    }

    setResettingDb(true);
    setDbResetMessage("");
    try {
      const res = await fetch("/api/progress", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Could not reset database progress.");
      resetLocalProgress();
      await refreshProgress();
      setDbResetMessage("Account progress reset.");
    } catch (err) {
      setDbResetMessage(err.message || "Could not reset database progress.");
    } finally {
      setResettingDb(false);
    }
  };

  return (
    <div className="page-top-space">
      <section className="section-tight pb-5">
        <Container>
          <div className="dash-cockpit">
            {/* 1. Cockpit Command Hero */}
            <Reveal>
              <div className="dash-hero-card">
                <div className="dash-hero-grid">
                  {/* Left: User identity & session state */}
                  <div>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      {isLoggedIn ? (
                        <span
                          className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                          style={{
                            width: 50,
                            height: 50,
                            fontSize: "1.3rem",
                            background: "var(--ember)",
                          }}
                        >
                          {user.username[0].toUpperCase()}
                        </span>
                      ) : (
                        <CalphyMascot size={50} mood="wave" />
                      )}
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h1 className="fw-bold h4 mb-0">
                            {authLoading
                              ? "Checking session…"
                              : isLoggedIn
                              ? `Welcome back, ${user.username}`
                              : "Guest Learner"}
                          </h1>
                          <span
                            className="badge rounded-pill text-uppercase"
                            style={{
                              fontSize: "0.68rem",
                              letterSpacing: "0.05em",
                              background: masteryRank.color,
                              color: "#fff",
                            }}
                          >
                            {masteryRank.badge}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span
                            className={`badge-mode ${
                              isLoggedIn ? "user" : "guest"
                            }`}
                          >
                            <i
                              className={`bi ${
                                isLoggedIn
                                  ? dbStatus === "offline"
                                    ? "bi-exclamation-circle text-danger"
                                    : "bi-cloud-check-fill text-success"
                                  : "bi-hdd-fill text-muted"
                              } me-1`}
                            />
                            {isLoggedIn
                              ? dbStatus === "offline"
                                ? "Offline Cache"
                                : "Cloud Synced"
                              : "Local Storage"}
                          </span>
                          {isLoggedIn ? (
                            <button
                              className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                              onClick={refreshProgress}
                              title="Re-sync progress"
                            >
                              <i className="bi bi-arrow-repeat" />
                            </button>
                          ) : (
                            <Link
                              href="/login"
                              className="small fw-semibold text-decoration-none"
                              style={{ color: "var(--ember)" }}
                            >
                              Sign in to sync →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spotlight Resume Action */}
                    <div className="dash-resume-card">
                      <div>
                        <span
                          className="badge bg-secondary-subtle text-secondary-emphasis fw-bold text-uppercase mb-1"
                          style={{ fontSize: "0.65rem", letterSpacing: "0.06em" }}
                        >
                          {nextUp.tag}
                        </span>
                        <h2 className="h6 fw-bold mb-0 text-dark">{nextUp.title}</h2>
                        <p className="text-muted small mb-0 d-none d-md-block">
                          {nextUp.subtitle}
                        </p>
                      </div>
                      <Link href={nextUp.url} className="btn btn-flame btn-sm text-nowrap">
                        {nextUp.btnText}
                      </Link>
                    </div>
                  </div>

                  {/* Right: Circular Mastery Gauge */}
                  <div className="d-flex flex-column align-items-center justify-content-center p-2">
                    <ProgressRing value={overall} size={110} stroke={10}>
                      <span className="fw-bold h4 mb-0">{overall}%</span>
                      <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                        Mastery
                      </span>
                    </ProgressRing>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* 2. Telemetry KPI Strip */}
            <Reveal delay={60}>
              <div className="dash-kpi-grid">
                <div className="dash-kpi-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="dash-kpi-label">Lessons Done</span>
                    <i className="bi bi-book text-muted" />
                  </div>
                  <div className="dash-kpi-val gradient-text">
                    {lessonsDone}
                    <span className="text-muted fw-normal fs-6">/{LESSONS.length}</span>
                  </div>
                  <div className="progress-thin mt-1">
                    <div
                      className="bar"
                      style={{ width: `${(lessonsDone / LESSONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="dash-kpi-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="dash-kpi-label">Quizzes Passed</span>
                    <i className="bi bi-patch-check text-muted" />
                  </div>
                  <div className="dash-kpi-val gradient-text-cool">
                    {quizzesDone}
                    <span className="text-muted fw-normal fs-6">/{QUIZZES.length}</span>
                  </div>
                  <div className="progress-thin mt-1">
                    <div
                      className="bar cool"
                      style={{ width: `${(quizzesDone / QUIZZES.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="dash-kpi-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="dash-kpi-label">Average Accuracy</span>
                    <i className="bi bi-graph-up-arrow text-muted" />
                  </div>
                  <div
                    className="dash-kpi-val"
                    style={{
                      color:
                        avgScore >= 70
                          ? "var(--good)"
                          : avgScore > 0
                          ? "var(--ember)"
                          : "var(--muted)",
                    }}
                  >
                    {avgScore}%
                  </div>
                  <div className="progress-thin mt-1">
                    <div
                      className="bar green"
                      style={{ width: `${avgScore}%` }}
                    />
                  </div>
                </div>

                <div className="dash-kpi-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="dash-kpi-label">Rank</span>
                    <i className="bi bi-trophy text-muted" />
                  </div>
                  <div className="dash-kpi-val fs-4 text-truncate">
                    {masteryRank.title}
                  </div>
                  <span className="small text-muted text-truncate">
                    {overall === 100
                      ? "Top tier reached"
                      : `${100 - overall}% to full completion`}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* 3. Module Matrix & Filter Controls */}
            <Reveal delay={120}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-2">
                <div>
                  <h3 className="h5 fw-bold mb-1">Learning Curriculum</h3>
                  <p className="text-muted small mb-0">
                    4 Core Units · 9 Guided Lessons · 10 Mastery Checkpoints
                  </p>
                </div>

                {/* Segmented Filter Pills */}
                <div className="dash-segmented" role="tablist">
                  <button
                    className={`dash-seg-btn ${activeFilter === "all" ? "active" : ""}`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All Modules
                  </button>
                  <button
                    className={`dash-seg-btn ${
                      activeFilter === "in_progress" ? "active" : ""
                    }`}
                    onClick={() => setActiveFilter("in_progress")}
                  >
                    In Progress
                  </button>
                  <button
                    className={`dash-seg-btn ${
                      activeFilter === "completed" ? "active" : ""
                    }`}
                    onClick={() => setActiveFilter("completed")}
                  >
                    Completed
                  </button>
                  <button
                    className={`dash-seg-btn ${
                      activeFilter === "quizzes" ? "active" : ""
                    }`}
                    onClick={() => setActiveFilter("quizzes")}
                  >
                    Quizzes Only
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Unit Modules Grid */}
            <div className="mt-2">
              {UNITS.map((unit, uIdx) => {
                const unitLessons = unit.lessons
                  .map((lKey) => LESSONS.find((l) => l.key === lKey))
                  .filter(Boolean);

                const filteredLessons = unitLessons.filter((l) => {
                  const lSt = lessonStatus(progress, l.key);
                  const qId = `Quiz${l.n}`;
                  const qSt = quizStatus(progress, qId);

                  if (activeFilter === "completed") {
                    return lSt === "Finished";
                  }
                  if (activeFilter === "in_progress") {
                    return lSt === "Current" || (lSt === "Finished" && qSt !== "Finished");
                  }
                  return true;
                });

                if (!filteredLessons.length) return null;

                return (
                  <Reveal key={unit.id} delay={uIdx * 40}>
                    <div className="dash-unit-card">
                      <div className="dash-unit-header">
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${unit.icon} fs-5 text-muted`} />
                          <div>
                            <span className="fw-bold small text-dark d-block">
                              Unit {uIdx + 1}: {unit.title}
                            </span>
                            <span className="text-muted extra-small d-none d-sm-inline">
                              {unit.subtitle}
                            </span>
                          </div>
                        </div>
                        <span className="badge bg-body-secondary text-secondary-emphasis small fw-semibold">
                          {unitLessons.filter(
                            (l) => lessonStatus(progress, l.key) === "Finished"
                          ).length}{" "}
                          / {unitLessons.length} Done
                        </span>
                      </div>

                      <div>
                        {filteredLessons.map((l) => {
                          const lSt = lessonStatus(progress, l.key);
                          const pairedQuiz = QUIZZES.find(
                            (q) => q.lessons?.includes(l.key) || q.id === `Quiz${l.n}`
                          );
                          const qSt = pairedQuiz
                            ? quizStatus(progress, pairedQuiz.id)
                            : "NotStarted";
                          const qSc = pairedQuiz
                            ? quizScore(progress, pairedQuiz.id)
                            : 0;

                          return (
                            <div className="dash-module-item" key={l.key}>
                              {/* Left: Number + Status */}
                              <div className="d-flex align-items-center gap-3 min-w-0">
                                <span
                                  className={`check-dot ${
                                    lSt === "Finished"
                                      ? "done"
                                      : lSt === "Current"
                                      ? "current"
                                      : ""
                                  }`}
                                >
                                  {lSt === "Finished" ? (
                                    <i className="bi bi-check-lg" />
                                  ) : (
                                    l.n
                                  )}
                                </span>
                                <div className="text-truncate">
                                  <Link
                                    href={`/lessons/${l.slug}`}
                                    className="fw-bold text-dark text-decoration-none d-block text-truncate"
                                  >
                                    {l.title}
                                  </Link>
                                  <span className="text-muted small text-truncate d-none d-md-block">
                                    {l.tagline}
                                  </span>
                                </div>
                              </div>

                              {/* Right: Actions & Quiz Pill */}
                              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                {pairedQuiz && (
                                  <Link
                                    href={`/quizzes/${pairedQuiz.slug}`}
                                    className={`dash-score-pill ${
                                      qSt === "Finished"
                                        ? qSc >= 70
                                          ? "good"
                                          : "warn"
                                        : "muted"
                                    }`}
                                    title={quizLabel(pairedQuiz.id)}
                                  >
                                    <i className="bi bi-pencil-square" />
                                    <span>
                                      {qSt === "Finished"
                                        ? `Quiz: ${qSc}%`
                                        : "Quiz"}
                                    </span>
                                  </Link>
                                )}

                                <Link
                                  href={`/lessons/${l.slug}`}
                                  className={`btn btn-sm ${
                                    lSt === "Finished"
                                      ? "btn-outline-ink"
                                      : lSt === "Current"
                                      ? "btn-flame"
                                      : "btn-outline-ink"
                                  }`}
                                >
                                  {lSt === "Finished"
                                    ? "Review"
                                    : lSt === "Current"
                                    ? "Continue"
                                    : "Start"}
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Reveal>
                );
              })}

              {/* Final Exam Showcase Card */}
              {activeFilter !== "in_progress" && (
                <Reveal delay={160}>
                  <div className="dash-final-card mt-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white"
                        style={{
                          width: 48,
                          height: 48,
                          background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                        }}
                      >
                        <i className="bi bi-award fs-4" />
                      </div>
                      <div>
                        <span
                          className="badge bg-primary-subtle text-primary-emphasis fw-bold mb-1"
                          style={{ fontSize: "0.68rem" }}
                        >
                          CAPSTONE EVALUATION
                        </span>
                        <h4 className="h6 fw-bold mb-1 text-dark">
                          Comprehensive Final Exam
                        </h4>
                        <p className="text-muted small mb-0 d-none d-sm-block">
                          Test your synthesis across all 9 units in one timed exam.
                        </p>
                      </div>
                    </div>
                    {finalExam && (
                      <div className="d-flex align-items-center gap-3">
                        {quizStatus(progress, finalExam.id) === "Finished" ? (
                          <span className="dash-score-pill good fs-6">
                            Score: {quizScore(progress, finalExam.id)}%
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary-emphasis d-none d-md-inline">
                            Not taken yet
                          </span>
                        )}
                        <Link
                          href={`/quizzes/${finalExam.slug}`}
                          className="btn btn-outline-ink btn-sm text-nowrap"
                        >
                          {quizStatus(progress, finalExam.id) === "Finished"
                            ? "Retake Exam"
                            : "Launch Exam →"}
                        </Link>
                      </div>
                    )}
                  </div>
                </Reveal>
              )}
            </div>

            {/* 4. Tucked Settings & Data Controls Drawer */}
            <div className="pt-3 border-top mt-3">
              <div className="d-flex align-items-center justify-content-between">
                <button
                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none d-flex align-items-center gap-1"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <i className={`bi bi-gear${showSettings ? "-fill text-dark" : ""}`} />
                  <span>Account & Storage Settings</span>
                  <i
                    className={`bi bi-chevron-${showSettings ? "up" : "down"} ms-1 small`}
                  />
                </button>

                {isLoggedIn && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={logout}
                  >
                    <i className="bi bi-box-arrow-right me-1" /> Log out
                  </button>
                )}
              </div>

              {showSettings && (
                <div className="dash-settings-card mt-3">
                  <div className="row g-3 align-items-center justify-content-between">
                    <div className="col-md-7">
                      <span className="fw-bold small d-block mb-1">
                        Progress Data Management
                      </span>
                      <p className="text-muted extra-small mb-0">
                        {isLoggedIn
                          ? "Your progress is synced with PostgreSQL. Resetting will clear completed lessons and quiz scores from your cloud account."
                          : "You are in guest mode. Progress is stored locally in your browser cache."}
                      </p>
                    </div>
                    <div className="col-md-5 text-md-end">
                      {isLoggedIn ? (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={resetDatabaseProgress}
                          disabled={resettingDb}
                        >
                          <i className="bi bi-database-x me-1" />
                          {resettingDb
                            ? "Resetting database…"
                            : "Reset Account Progress"}
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            if (window.confirm("Reset all local progress?")) {
                              resetLocalProgress();
                            }
                          }}
                        >
                          <i className="bi bi-trash3 me-1" /> Clear Local Data
                        </button>
                      )}
                    </div>
                  </div>
                  {dbResetMessage && (
                    <div
                      className={`small mt-2 ${
                        dbResetMessage === "Account progress reset."
                          ? "text-success"
                          : "text-danger"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      {dbResetMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
