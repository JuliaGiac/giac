// -*- mode:C++ ; compile-command: "g++ -I.. -g -c proba.cc" -*-
/*
 *  Copyright (C) 2000,2014 B. Parisse, Institut Fourier, 38402 St Martin d'Heres
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
#ifndef _GIAC_PROBA_H
#define _GIAC_PROBA_H
#include "first.h"

#ifndef NO_NAMESPACE_GIAC
namespace giac {
#endif // ndef NO_NAMESPACE_GIAC

  gen _Test(const gen & args,GIAC_CONTEXT);
  extern const unary_function_ptr * const  at_Test ;

  gen _cov_matrix(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_cov_matrix;

  gen _pca_eigenvalues(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_pca_eigenvalues;

  gen _pca_explained_ratio(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_pca_explained_ratio;

  gen _pca_select_q(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_pca_select_q;

  gen _pca_loadings(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_pca_loadings;

  gen _pca_scores(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_pca_scores;

  gen _pca(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_pca;

    gen _mlr_beta(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mlr_beta;
 
  gen _mlr_predict(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mlr_predict;
 
  gen _mlr_residuals(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mlr_residuals;
 
  gen _mlr_r2(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mlr_r2;
 
  gen _mlr_sigma2(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mlr_sigma2;
 
  gen _mlr_mse(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mlr_mse;
 
  gen _mlr_ic(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mlr_ic;
 
  gen _mlr(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mlr;

  gen _brownian(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_brownian;
 
  gen _gbm(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_gbm;
 
  gen _ornstein_uhlenbeck(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_ornstein_uhlenbeck;
 
  gen _cir(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_cir;
 
  gen _sde_euler(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_sde_euler;
 
  gen _sde_milstein(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_sde_milstein;
  
  gen _bs_price(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_bs_price;
 
  gen _bs_delta(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_bs_delta;
 
  gen _bs_gamma(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_bs_gamma;
 
  gen _bs_vega(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_bs_vega;
 
  gen _bs_theta(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_bs_theta;
 
  gen _bs_rho(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_bs_rho;
 
  gen _bs_greeks(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_bs_greeks;
 
  gen _bs_implied_vol(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_bs_implied_vol;

  gen _mc_estimate(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mc_estimate;
 
  gen _mc_mean(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mc_mean;
 
  gen _mc_bs_price(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mc_bs_price;
 
  gen _mc_mean_antithetic(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mc_mean_antithetic;
 
  gen _mc_bs_price_antithetic(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_mc_bs_price_antithetic;

  gen _fit_gbm(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_fit_gbm;
 
  gen _fit_ou(const gen & args, GIAC_CONTEXT);
  extern const unary_function_ptr * const at_fit_ou;


#ifndef NO_NAMESPACE_GIAC
} // namespace giac
#endif // ndef NO_NAMESPACE_GIAC


#endif // _GIAC_PROBA_H
