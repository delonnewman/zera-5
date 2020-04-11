(ns zera.compiler
  (:require [clojure.spec.alpha :as s]))

(defprotocol IEnv
  (varMap [this])
  (resetVars [this vars]))

(deftype Env [^:volatile-mutable vars parent]
  IEnv
  (varMap [this] (.-vars this))
  (resetVars [this vars]
    (set! (.-vars this) vars)))

(defn env?
  [x] (instance? x Env))

(s/def ::env env?)

(defn env
  ([] (Env. {} nil))
  ([vars] (Env. vars nil))
  ([vars parent] (Env. vars parent)))

(defn lookup
  [scope sym]
  (if ((.varMap scope) sym)
    scope))

(defn define [scope sym value]
  (.resetVars scope (assoc (.varMap scope) sym value))
  scope)

(defn emit-comma-list
  [xs]
  (if (empty? xs)
    ""
    (reduce #(str %1 ", " %2) xs)))

(defn emit-nil
  [x] "null")

(defn self-evaluating?
  [x] (or (string? x) (number? x)))

; TODO: add more advanced string features
(def emit-self-evaluating pr-str)
(def quote-self-evaluating pr-str)

(defn emit-keyword [kw]
  (let [ns (namespace kw)
        nm (name kw)]
    (if ns
      (str "zera.core.keyword(\"" ns "\", \"" nm "\")")
      (str "zera.core.keyword(null, \"" nm "\")"))))

(def emit)

(defn emit-vector [v env]
  (let [elems (->> v (map #(emit % env)) emit-comma-list)]
    (str "zera.core.vector(" elems ")")))

(defn emit-map [m env]
  (let [pairs (->> m
                   (mapcat #(vector (emit (% 0) env) (emit (% 1) env)))
                   emit-comma-list)]
    (str "zera.core.hashMap(" pairs ")")))

(def tagged-value-or-application? list?)

(defn emit-identifier
  [sym env]
  (if-let [scope (lookup env sym)]
    (let [ns (namespace sym)
          nm (name sym)]
      (if ns
        (str ns "." nm)
        nm))
    (throw (Exception. (str "Unknown variable " sym)))))

(defn emit-application
  [form env]
  (let [args (->> (rest form)
                  emit-comma-list
                  (map #(emit % env)))]
    (str (emit (first form) env) ".call(null, " args ")")))

(def quote-sym 'quote)
(def def-sym 'def)
(def fn-sym 'fn)

(defn emit-quote
  [form]
  (cond (nil? form) "null"
        (self-evaluating? form) (quote-self-evaluating form)
        ))

(defn emit-def
  [form] "")

(defn emit-fn
  [form] "")

(defn emit-tagged-value-or-application
  [form env]
  (let [x (first form)]
    (if (symbol? x)
      (case x
        quote-sym (emit-quote form)
        def-sym   (emit-def form)
        fn-sym    (emit-fn form env)
        (emit-application form env))
      (emit-application form env)
      ))
  )

(def js? string?)

(s/def ::form
  (s/or :nil nil?
        :string string?
        :number number?
        :keyword keyword?
        :symbol symbol?
        :vector vector?
        :map map?
        :list list?
        :set set?))

(s/fdef emit
  :args (s/cat :form ::form :env env?)
  :ret js?)

(defn emit [form env]
  (cond (nil? form) "null"
        (self-evaluating? form) (emit-self-evaluating form)
        (keyword? form) (emit-keyword form)
        (vector? form) (emit-vector form env)
        (map? form) (emit-map form env)
        (symbol? form) (emit-identifier form env)
        (tagged-value-or-application? form)
          (emit-tagged-value-or-application form env)
        :else
          (throw (Exception. (str "Unknown form " form)))))

(def ^:private top (env))

(define top 'a 1)

(defn compile
  ([form] (emit form top))
  ([form env] (emit form env)))
